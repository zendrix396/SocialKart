import os
import shutil
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin 
from video_caption_grabber import grab_post, process_product_background
from separate_frames import video_to_frames
from classify_frames import classify_and_move_images
from transcribe_video import transcribe_video
from parse_gemini import parse_content
import threading
import uuid
import psutil  
from flask import send_file
import re
from utils import parse_claude_response, process_image
from flask import send_from_directory
from threading import Thread, Lock
import time
app = Flask(__name__)
CORS(app, resources={
    r"/video/*": {"origins": "*"},  # Add specific CORS rule for video endpoint
    r"/*": {"origins": "*"}         # General CORS rule
})
os.makedirs("posts", exist_ok=True)

progress_store = {}
progress_lock = Lock()
@app.route('/cleanup', methods=['POST'])
def cleanup():
    try:
        if os.path.exists("posts"):
            # Find and kill processes using the video files
            print("inside cleanup")
            for proc in psutil.process_iter(['pid', 'name', 'open_files']):
                try:
                    # Skip if it's our Python process
                    if proc.name().lower() in ['python.exe', 'python', 'pythonw.exe']:
                        continue
                        
                    for file in proc.open_files():
                        if 'video.mp4' in file.path and 'posts\\post_' in file.path:
                            print(f"Killing process {proc.pid} that's using video file")
                            proc.kill()
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    continue

            # Small delay to ensure processes are terminated
            time.sleep(0.1)

            # Now delete the posts directory and its contents
            for item in os.listdir("posts"):
                if item.startswith("post_"):
                    folder_path = os.path.join("posts", item)
                    try:
                        shutil.rmtree(folder_path, ignore_errors=True)
                    except:
                        if os.name == 'nt':
                            os.system(f'rd /s /q "{folder_path}" 2>nul')
                        else:
                            os.system(f'rm -rf "{folder_path}"')

            # Delete and recreate main posts directory
            shutil.rmtree("posts", ignore_errors=True)
            os.makedirs("posts", exist_ok=True)
            
        return jsonify({"message": "Cleanup successful"}), 200

    except Exception as e:
        print(f"Error during cleanup: {e}")
        return jsonify({"error": str(e)}), 500
result_store = {}
result_lock = threading.Lock()
def process_instagram_post_async(request_id, shortcode):
    try:
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

        if post_info.get('is_video', False): 
            video_path = f"posts/post_{shortcode}/video.mp4"
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
            with progress_lock:
                progress_store[request_id]["current_step"] = "Processing images..."
                progress_store[request_id]["progress"] = 60
            print("Skipping video processing for image post")

        with progress_lock:
            progress_store[request_id]["current_step"] = "Generating listing..."
            progress_store[request_id]["progress"] = 80

        parsed_content = parse_content(shortcode, "posts")
        structured_content = parse_claude_response(parsed_content)

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

        with result_lock:
            result_store[request_id] = {
                'structured_content': structured_content,
                'raw_content': parsed_content,
                'images': image_urls[:MAX_IMAGES],
                'is_video': post_info.get('is_video', False),
                'media_count': post_info.get('media_count', 1)
            }

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
@app.route('/video/<shortcode>', methods=['GET'])
@cross_origin()  # Add CORS support specifically for video
def get_video(shortcode):
    try:
        video_path = f"posts/post_{shortcode}/video.mp4"
        if os.path.exists(video_path):
            directory = os.path.dirname(video_path)
            filename = os.path.basename(video_path)
            return send_from_directory(directory, filename, mimetype='video/mp4')
        else:
            return jsonify({'error': 'Video file not found'}), 404
                
    except Exception as e:
        print(f"Error serving video: {str(e)}")
        return jsonify({'error': str(e)}), 500
@app.route('/process', methods=['POST'])
def process_instagram_post():
    data = request.get_json()
    instagram_url = data.get('url')
    
    if not instagram_url:
        return jsonify({'error': 'No URL provided.'}), 400

    # Regular expression to match both URL formats
    instagram_pattern = r'https?://(?:www\.)?instagram\.com/p/([A-Za-z0-9_-]+)(?:/?\?.*)?'
    match = re.match(instagram_pattern, instagram_url)

    if not match:
        return jsonify({'error': 'Invalid Instagram URL format. Please use a URL like https://www.instagram.com/p/SHORTCODE/'}), 400

    # Extract the shortcode from the matched pattern
    shortcode = match.group(1)

    request_id = str(uuid.uuid4())
    with progress_lock:
        progress_store[request_id] = {
            "current_step": "Initializing...",
            "progress": 0
        }

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
            
        request_id = str(uuid.uuid4())
        with progress_lock:
            progress_store[request_id] = {
                "current_step": "Initializing...",
                "progress": 0,
                "error": None
            }
        
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
            print("Sending result:", result.keys())
            response_data = {
                'structured_content': result.get('structured_content', {}),
                'raw_content': result.get('raw_content', ''),
                'images': result.get('images', [])
            }
            return jsonify(response_data)
            
    except Exception as e:
        print(f"Error in get_result: {str(e)}")
        import traceback
        traceback.print_exc()  
        return jsonify({'error': str(e)}), 500
if __name__ == '__main__':
    app.run(debug=True)