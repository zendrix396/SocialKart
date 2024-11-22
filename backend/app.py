import os
import shutil
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from video_caption_grabber import grab_post, process_product_background
from separate_frames import video_to_frames
from classify_frames import classify_and_move_images
from transcribe_video import transcribe_video
from parse_gemini import parse_content
import threading
import uuid
import psutil  # Add this import at the top of your file
import atexit
from utils import parse_claude_response, process_image
from threading import Thread, Lock
import time
app = Flask(__name__)
CORS(app)
os.makedirs("posts", exist_ok=True)

# Progress and result stores
progress_store = {}
progress_lock = Lock()

@app.route('/cleanup', methods=['POST'])
def cleanup():
    try:
        if os.path.exists("posts"):
            print("Found posts directory, attempting cleanup...")
            
            # Force close any open file handles in the posts directory
            for proc in psutil.process_iter(['pid', 'open_files']):
                try:
                    for file in proc.info['open_files'] or []:
                        if 'posts' in file.path:
                            try:
                                proc.kill()
                            except:
                                pass
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

            # Try multiple times to remove the directory
            max_attempts = 3
            for attempt in range(max_attempts):
                try:
                    shutil.rmtree("posts", ignore_errors=True)
                    # Double check if directory is really gone
                    if not os.path.exists("posts"):
                        break
                    print(f"Attempt {attempt + 1} to remove directory")
                except Exception as e:
                    print(f"Attempt {attempt + 1} failed: {e}")
                    time.sleep(1)  # Wait a second before next attempt
            
            # Final force remove if directory still exists
            if os.path.exists("posts"):
                os.system('rm -rf posts' if os.name != 'nt' else 'rd /s /q posts')
        
        # Create fresh posts directory
        os.makedirs("posts", exist_ok=True)
        print("Created fresh posts directory")
            
        return jsonify({"message": "Cleanup successful"}), 200
    except Exception as e:
        print(f"Error during cleanup: {e}")
        return jsonify({"error": str(e)}), 500
result_store = {}
result_lock = threading.Lock()
def process_instagram_post_async(request_id, shortcode):
    try:
        # Step 1: Download media and caption (20% of total progress)
        with progress_lock:
            progress_store[request_id] = {
                "current_step": "Downloading media and caption...",
                "progress": 0
            }
        
        post_info = grab_post(shortcode, "posts")
        if not post_info:
            raise Exception("Failed to get post information")

        with progress_lock:
            progress_store[request_id]["progress"] = 20

        if post_info.get('is_video', False):  # Safely check if it's a video
            # Process video post
            video_path = f"posts/post_{shortcode}/video.mp4"
            
            # Video processing steps...
            with progress_lock:
                progress_store[request_id]["current_step"] = "Separating frames..."
                progress_store[request_id]["progress"] = 20
            video_to_frames(video_path, "posts", shortcode, request_id, progress_lock, progress_store)

            with progress_lock:
                progress_store[request_id]["current_step"] = "Classifying frames..."
                progress_store[request_id]["progress"] = 40
            classify_and_move_images(shortcode, "posts", request_id, progress_lock, progress_store)

            with progress_lock:
                progress_store[request_id]["current_step"] = "Transcribing audio..."
                progress_store[request_id]["progress"] = 60
            transcribe_video(video_path, "posts", shortcode)
        else:
            # Skip video processing for image posts
            with progress_lock:
                progress_store[request_id]["current_step"] = "Processing images..."
                progress_store[request_id]["progress"] = 60
            print("Skipping video processing for image post")

        # Continue with content parsing
        with progress_lock:
            progress_store[request_id]["current_step"] = "Generating listing..."
            progress_store[request_id]["progress"] = 80

        parsed_content = parse_content(shortcode, "posts")
        structured_content = parse_claude_response(parsed_content)

        # Process images from the relevant directory
        relevant_dir = post_info['relevant_dir']
        images = [img for img in os.listdir(relevant_dir) if img.lower().endswith(('.png', '.jpg', '.jpeg'))]
        image_urls = []
        
        MAX_IMAGES = 5
        for img in images[:MAX_IMAGES]:
            try:
                image_path = os.path.join(relevant_dir, img)
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
                'images': image_urls[:MAX_IMAGES],
                'is_video': post_info.get('is_video', False),
                'media_count': post_info.get('media_count', 1)
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
        # try:
        #     shutil.rmtree("posts", ignore_errors=True)
        # except Exception as cleanup_error:
        #     print(f"Error during cleanup: {cleanup_error}")

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
@app.route('/process_product', methods=['POST'])
def process_product():
    try:
        data = request.json
        product_name = data.get('product_name')
        
        if not product_name:
            return jsonify({"error": "Product name is required"}), 400
            
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        
        # Initialize progress in the store
        with progress_lock:
            progress_store[request_id] = {
                "current_step": "Initializing...",
                "progress": 0,
                "error": None
            }
        
        # Start processing in background
        thread = Thread(target=process_product_background, 
                       args=(product_name, request_id, progress_store, progress_lock))
        thread.start()
        
        return jsonify({"request_id": request_id})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
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