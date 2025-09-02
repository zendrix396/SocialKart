import eventlet
eventlet.monkey_patch()

import os
import shutil
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from video_caption_grabber import grab_post
from separate_frames import video_to_frames
from classify_frames import classify_and_move_images
from parse_gemini import parse_content
from transcribe_video import transcribe_video
import re
from flask import send_from_directory
import time
import uuid
import json
import threading
from datetime import datetime, timedelta


app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')
CORS(app)

# Base directory for all temporary processing
TEMP_PROCESSING_DIR = "temp_processing"
os.makedirs(TEMP_PROCESSING_DIR, exist_ok=True)


@app.route('/image/<request_id>/<filename>')
def get_image(request_id, filename):
    # Security: Sanitize filename to prevent directory traversal
    if ".." in filename or filename.startswith("/"):
        return "Invalid filename", 400
    
    image_dir = os.path.join(TEMP_PROCESSING_DIR, request_id, "relevant_final")
    return send_from_directory(image_dir, filename)


@app.route('/results/<request_id>', methods=['GET'])
def get_past_result(request_id):
    request_dir = os.path.join(TEMP_PROCESSING_DIR, request_id)
    result_path = os.path.join(request_dir, "result.json")

    if not os.path.exists(result_path):
        return jsonify({"error": "Result not found or has been cleaned up."}), 404

    with open(result_path, 'r') as f:
        structured_content = json.load(f)

    final_images = []
    final_images_dir = os.path.join(request_dir, "relevant_final")
    if os.path.exists(final_images_dir):
        image_files = sorted(os.listdir(final_images_dir))
        for filename in image_files[:30]:
            final_images.append(f"/image/{request_id}/{filename}")
    
    return jsonify({
        'structured_content': structured_content,
        'images': final_images,
        'request_id': request_id # Pass back the request_id
    })

@app.route('/cleanup/<request_id>', methods=['POST'])
def cleanup_request(request_id):
    try:
        request_dir = os.path.join(TEMP_PROCESSING_DIR, request_id)
        if os.path.exists(request_dir):
            shutil.rmtree(request_dir)
            print(f"Cleaned up directory: {request_dir}")
            return jsonify({"message": "Cleanup successful."}), 200
        else:
            return jsonify({"message": "Directory not found, already cleaned up."}), 200
    except Exception as e:
        print(f"Error during cleanup: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/cleanup_all', methods=['POST'])
def cleanup_all():
    try:
        if os.path.exists(TEMP_PROCESSING_DIR):
            for entry in os.listdir(TEMP_PROCESSING_DIR):
                entry_path = os.path.join(TEMP_PROCESSING_DIR, entry)
                if os.path.isdir(entry_path):
                    shutil.rmtree(entry_path)
            return jsonify({"message": "All temporary data cleaned."}), 200
        else:
            return jsonify({"message": "No temp directory found."}), 200
    except Exception as e:
        print(f"Error during cleanup_all: {e}")
        return jsonify({"error": str(e)}), 500


def process_instagram_post_sync(sid, shortcode, request_id, request_dir):
    try:
        socketio.emit('progress', {'data': 'Downloading media and caption...', 'progress': 20}, room=sid)
        post_info = grab_post(shortcode, request_dir)
        if not post_info:
            raise Exception("Failed to get post information")

        video_path = post_info.get('video_path')

        if video_path:
            socketio.emit('progress', {'data': 'Separating frames from video...', 'progress': 40}, room=sid)
            frames_output_dir = os.path.join(request_dir, "frames")
            video_to_frames(video_path, frames_output_dir, shortcode)
            
            socketio.emit('progress', {'data': 'Classifying frames and selecting the best ones...', 'progress': 60}, room=sid)
            classify_and_move_images(shortcode, request_dir, frames_output_dir)

            socketio.emit('progress', {'data': 'Extracting and transcribing audio...', 'progress': 80}, room=sid)
            transcribe_video(video_path, request_dir)
        
        socketio.emit('progress', {'data': 'Generating final listing with AI...', 'progress': 95}, room=sid)
        parsed_content = parse_content(shortcode, request_dir)
        # Ensure caption.txt exists even if Instaloader changes behavior
        caption_path = os.path.join(request_dir, 'caption.txt')
        if not os.path.exists(caption_path):
            try:
                with open(caption_path, 'w', encoding='utf-8') as cf:
                    cf.write("")
            except Exception:
                pass
        
        with open(os.path.join(request_dir, 'result.json'), 'w') as f:
            json.dump(parsed_content, f)

        final_images = [f"/image/{request_id}/{f}" for f in sorted(os.listdir(os.path.join(request_dir, "relevant_final")))[:30]]

        expiration_time = datetime.now() + timedelta(minutes=10)
        
        socketio.emit('result', {
            'structured_content': parsed_content,
            'images': final_images,
            'request_id': request_id,
            'expiration_timestamp': expiration_time.isoformat()
        }, room=sid)
        
        socketio.sleep(0.1)

    except Exception as e:
        socketio.emit('error', {'error': str(e)}, room=sid)
        if os.path.exists(request_dir):
            shutil.rmtree(request_dir)

@socketio.on('start_processing')
def handle_start_processing(json_data):
    url = json_data.get('url')
    sid = request.sid # Session ID for this client

    match = re.search(r'instagram\.com/p/([A-Za-z0-9_-]+)', url)
    if not match:
        emit('error', {'error': 'Invalid Instagram URL format.'}, room=sid)
        return

    shortcode = match.group(1)
    request_id = str(uuid.uuid4())
    request_dir = os.path.join(TEMP_PROCESSING_DIR, request_id)
    os.makedirs(request_dir, exist_ok=True)

    # Offload the long-running task to a background thread
    socketio.start_background_task(process_instagram_post_sync, sid, shortcode, request_id, request_dir)


if __name__ == '__main__':
    socketio.run(app, debug=True)