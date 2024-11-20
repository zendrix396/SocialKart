import os
import shutil
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from video_caption_grabber import grab_post
from separate_frames import video_to_frames
from classify_frames import classify_and_move_images
from transcribe_video import transcribe_video
from parse_gemini import parse_content
import threading
import uuid
from utils import parse_claude_response, process_image
app = Flask(__name__)
CORS(app)
os.makedirs("posts", exist_ok=True)

# Progress and result stores
progress_store = {}
progress_lock = threading.Lock()

result_store = {}
result_lock = threading.Lock()
def process_instagram_post_async(request_id, shortcode):
    try:
        # Step 1: Download media and caption (10% of total progress)
        with progress_lock:
            progress_store[request_id] = {
                "current_step": "Downloading media and caption...",
                "progress": 0
            }
        grab_post(shortcode, "posts")
        with progress_lock:
            progress_store[request_id]["progress"] = 10

        # Step 2: Extract frames (30% of total progress)
        with progress_lock:
            progress_store[request_id] = {
                "current_step": "Separating frames...",
                "progress": 10
            }
        video_path = f"posts/post_{shortcode}/video.mp4"
        video_to_frames(video_path, "posts", shortcode, request_id, progress_lock, progress_store)

        # Step 3: Classify frames (40% of total progress)
        with progress_lock:
            progress_store[request_id] = {
                "current_step": "Classifying frames...",
                "progress": 40
            }
        classify_and_move_images(shortcode, "posts", request_id, progress_lock, progress_store)

        # Step 4: Transcribe video (15% of total progress)
        with progress_lock:
            progress_store[request_id] = {
                "current_step": "Transcribing audio...",
                "progress": 80
            }
        transcribe_video(video_path, "posts", shortcode)

        # Step 5: Parse content (5% of total progress)
        with progress_lock:
            progress_store[request_id] = {
                "current_step": "Generating listing...",
                "progress": 95
            }
        parsed_content = parse_content(shortcode, "posts")
        structured_content = parse_claude_response(parsed_content)

        # Process images with size limit
        relevant_dir = f"posts/output_frames_{shortcode}/relevant"
        images = [img for img in os.listdir(relevant_dir) if img.lower().endswith(('.png', '.jpg', '.jpeg'))]
        image_urls = []
        
        # Limit number of images and their size
        MAX_IMAGES = 5
        MAX_IMAGE_SIZE = 1024 * 1024  # 1MB limit per image
        
        for img in images[:MAX_IMAGES]:  # Only process first 5 images
            try:
                image_path = f"{relevant_dir}/{img}"
                processed_image = process_image(image_path)
                if processed_image:
                    image_urls.append(processed_image)
            except Exception as e:
                print(f"Error processing image {img}: {str(e)}")
                continue

        # Store result
        with result_lock:
            result_store[request_id] = {
                'structured_content': structured_content,
                'raw_content': parsed_content,
                'images': image_urls[:MAX_IMAGES],  # Ensure we only store limited images
            }

        # Process completed
        with progress_lock:
            progress_store[request_id] = {
                "current_step": "Completed",
                "progress": 100,
                "result_ready": True
            }
            
    except Exception as e:
        print(f"Error in process_instagram_post_async: {str(e)}")
        with progress_lock:
            progress_store[request_id] = {
                "current_step": "Error",
                "error": str(e),
                "progress": 0
            }
        # Clean up in case of error
        shutil.rmtree("posts", ignore_errors=True)

@app.route('/process', methods=['POST'])
def process_instagram_post():
    data = request.get_json()
    instagram_url = data.get('url')
    if not instagram_url:
        return jsonify({'error': 'No URL provided.'}), 400
    try:
        shortcode = instagram_url.rstrip('/').split('/')[-1]
    except Exception as e:
        return jsonify({'error': 'Invalid Instagram URL.'}), 400

    request_id = str(uuid.uuid4())
    with progress_lock:
        progress_store[request_id] = {
            "current_step": "Initializing...",
            "progress": 0
        }

    # Start background thread
    thread = threading.Thread(target=process_instagram_post_async, args=(request_id, shortcode))
    thread.start()

    return jsonify({'request_id': request_id}), 202

@app.route('/progress/<request_id>', methods=['GET'])
def get_progress(request_id):
    with progress_lock:
        progress = progress_store.get(request_id)
        if not progress:
            return jsonify({'error': 'Invalid request ID.'}), 404
            
        # Add result readiness check
        with result_lock:
            result_ready = request_id in result_store
            
        return jsonify({
            **progress,
            'result_ready': result_ready
        })
@app.route('/result/<request_id>', methods=['GET'])
def get_result(request_id):
    try:
        with result_lock:
            result = result_store.get(request_id)
            if not result:
                return jsonify({'error': 'Result not ready yet.'}), 404

            # Debug print
            print("Sending result:", result.keys())
            
            # Ensure the response is properly formatted
            response_data = {
                'structured_content': result.get('structured_content', {}),
                'raw_content': result.get('raw_content', ''),
                'images': result.get('images', [])
            }
            
            return jsonify(response_data)
            
    except Exception as e:
        print(f"Error in get_result: {str(e)}")
        import traceback
        traceback.print_exc()  # Print full error traceback
        return jsonify({'error': str(e)}), 500
if __name__ == '__main__':
    app.run(debug=True)