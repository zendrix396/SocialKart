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
import video_caption_grabber as vcg


app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')
CORS(app)

# Base directory for all temporary processing
TEMP_PROCESSING_DIR = "temp_processing"
# How long to keep generated artifacts accessible to the frontend
DATA_TTL_SECONDS = 600  # 10 minutes
# Index file to map shortcode -> request_id for reuse
INDEX_PATH = os.path.join(TEMP_PROCESSING_DIR, "index.json")
os.makedirs(TEMP_PROCESSING_DIR, exist_ok=True)

# Track active requests by WebSocket session and allow graceful cancellation/cleanup
sid_to_request = {}
canceled_sids = set()


def _read_index():
    try:
        if os.path.exists(INDEX_PATH):
            with open(INDEX_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def _write_index(index_data):
    try:
        os.makedirs(TEMP_PROCESSING_DIR, exist_ok=True)
        with open(INDEX_PATH, "w", encoding="utf-8") as f:
            json.dump(index_data, f)
    except Exception:
        pass


def _remaining_ttl_seconds(request_dir):
    now_ts = time.time()
    try:
        last_mtime = os.path.getmtime(request_dir)
    except Exception:
        return 0
    for root, _, files in os.walk(request_dir):
        for fname in files:
            try:
                last_mtime = max(last_mtime, os.path.getmtime(os.path.join(root, fname)))
            except Exception:
                pass
    spent = now_ts - last_mtime
    remain = int(max(0, DATA_TTL_SECONDS - spent))
    return remain


def _cleanup_request_dir(request_dir):
    try:
        if os.path.exists(request_dir):
            shutil.rmtree(request_dir)
    except Exception:
        pass


def _placeholder_result(caption_text, transcript_text):
    base_desc = caption_text or transcript_text or ""
    return {
        "product_name": "Generated Listing",
        "description": base_desc,
        "key_features": [],
        "target_audience": "",
        "seo_keywords": [],
        "technical_details": {},
        "technical_details_schema": {"category": "", "properties": {}}
    }


def _emit_cached_result(sid, shortcode):
    index = _read_index()
    entry = index.get(shortcode)
    if not entry:
        return False
    request_id = entry.get("request_id")
    if not request_id:
        return False
    request_dir = os.path.join(TEMP_PROCESSING_DIR, request_id)
    result_path = os.path.join(request_dir, "result.json")
    final_images_dir = os.path.join(request_dir, "relevant_final")
    if not (os.path.exists(result_path) and os.path.isdir(final_images_dir)):
        return False

    remaining = _remaining_ttl_seconds(request_dir)
    if remaining <= 0:
        return False

    try:
        with open(result_path, 'r', encoding='utf-8') as f:
            structured_content = json.load(f)
    except Exception:
        return False

    image_files = sorted(os.listdir(final_images_dir))
    final_images = [f"/image/{request_id}/{filename}" for filename in image_files[:30]]

    expiration_time = datetime.utcnow() + timedelta(seconds=remaining)
    socketio.emit('result', {
        'structured_content': structured_content,
        'images': final_images,
        'request_id': request_id,
        'expiration_timestamp': expiration_time.isoformat() + 'Z',
        'expires_in_seconds': remaining
    }, room=sid)
    socketio.sleep(0.05)
    return True
@app.route('/')
def index():
    return "API is running!"

@app.route('/image/<request_id>/<filename>')
def get_image(request_id, filename):
    # Security: Sanitize filename to prevent directory traversal
    if ".." in filename or filename.startswith("/"):
        return "Invalid filename", 400
    
    image_dir = os.path.join(TEMP_PROCESSING_DIR, request_id, "relevant_final")
    return send_from_directory(image_dir, filename)


@app.route('/video/<request_id>/video.mp4')
def get_video(request_id):
    """Serve the processed video file for previews."""
    request_dir = os.path.join(TEMP_PROCESSING_DIR, request_id)
    video_path = os.path.join(request_dir, "video.mp4")
    if not os.path.exists(video_path):
        return "Video not found", 404
    return send_from_directory(request_dir, "video.mp4")

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
            now_ts = time.time()
            deleted = []
            kept = []
            for entry in os.listdir(TEMP_PROCESSING_DIR):
                entry_path = os.path.join(TEMP_PROCESSING_DIR, entry)
                if not os.path.isdir(entry_path):
                    continue

                # Determine last modification time inside the request dir
                last_mtime = os.path.getmtime(entry_path)
                for root, _, files in os.walk(entry_path):
                    for fname in files:
                        try:
                            last_mtime = max(last_mtime, os.path.getmtime(os.path.join(root, fname)))
                        except Exception:
                            pass

                if (now_ts - last_mtime) > DATA_TTL_SECONDS:
                    shutil.rmtree(entry_path)
                    deleted.append(entry)
                else:
                    kept.append(entry)

            return jsonify({"message": "Cleanup completed.", "deleted": deleted, "kept": kept}), 200
        else:
            return jsonify({"message": "No temp directory found."}), 200
    except Exception as e:
        print(f"Error during cleanup_all: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/update', methods=['POST'])
def update_session():
    try:
        payload = request.get_json(silent=True) or {}
        session_id = payload.get('sessionId') or payload.get('sessionid') or payload.get('SESSIONID')
        if not session_id:
            return jsonify({"error": "Missing sessionId in body"}), 400
        # Update the module-level variable used for cookie-based login
        vcg.INSTAGRAM_SESSIONID = session_id
        # Bust the cached Instaloader session so the next call re-initializes with new cookie
        try:
            vcg.get_instaloader_session.cache_clear()
        except Exception:
            pass
        # Also persist the session id into the source file so it's visible and survives restarts
        try:
            vcg_path = os.path.join(os.path.dirname(__file__), 'video_caption_grabber.py')
            with open(vcg_path, 'r', encoding='utf-8') as f:
                src = f.read()
            # Escape quotes in the cookie if any
            safe_cookie = session_id.replace('"', '\\"')
            new_src = re.sub(r'^INSTAGRAM_SESSIONID\s*=\s*".*?"', f'INSTAGRAM_SESSIONID = "{safe_cookie}"', src, count=1, flags=re.MULTILINE)
            if new_src != src:
                with open(vcg_path, 'w', encoding='utf-8') as f:
                    f.write(new_src)
        except Exception:
            # Persistence is best-effort; runtime update already applied
            pass
        return jsonify({"message": "Session updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def process_instagram_post_sync(sid, shortcode, request_id, request_dir):
    try:
        print(f"Starting processing for sid: {sid}, shortcode: {shortcode}")
        socketio.emit('progress', {'data': 'Downloading media and caption...', 'progress': 20}, room=sid)
        socketio.sleep(0.1)
        post_info = grab_post(shortcode, request_dir)
        if not post_info:
            raise Exception("Failed to get post information")
        print(f"Post info retrieved: {post_info}")

        # Emit the freshly downloaded original caption as early as possible
        try:
            caption_path_early = os.path.join(request_dir, 'caption.txt')
            if os.path.exists(caption_path_early):
                with open(caption_path_early, 'r', encoding='utf-8') as cf:
                    early_caption = cf.read()
                socketio.emit('caption_update', {'caption': early_caption}, room=sid)
                socketio.sleep(0.01)
        except Exception:
            pass

        video_path = post_info.get('video_path')

        # If client disconnected in between, stop early and cleanup
        if sid in canceled_sids:
            _cleanup_request_dir(request_dir)
            return

        if video_path:
            print(f"Processing video: {video_path}")
            socketio.emit('progress', {'data': 'Separating frames from video...', 'progress': 40}, room=sid)
            socketio.sleep(0.1)
            frames_output_dir = os.path.join(request_dir, "frames")
            video_to_frames(video_path, frames_output_dir, shortcode)
            print("Frame separation completed")
            # Notify frontend that frame separation has completed
            socketio.emit('progress', {'data': 'Frames separated successfully', 'progress': 50}, room=sid)
            socketio.sleep(0.1)

            if sid in canceled_sids:
                _cleanup_request_dir(request_dir)
                return

            socketio.emit('progress', {'data': 'Classifying frames and selecting the best ones...', 'progress': 60}, room=sid)
            socketio.sleep(0.1)
            classify_and_move_images(shortcode, request_dir, frames_output_dir)
            print("Frame classification completed")
            # Notify frontend that classification has completed
            socketio.emit('progress', {'data': 'Frame classification completed', 'progress': 70}, room=sid)
            socketio.sleep(0.1)
            # Optionally emit the original caption after classification so UI can show/update it
            try:
                caption_path = os.path.join(request_dir, 'caption.txt')
                if os.path.exists(caption_path):
                    with open(caption_path, 'r', encoding='utf-8') as cf:
                        original_caption = cf.read()
                    socketio.emit('caption_update', {'caption': original_caption}, room=sid)
                    socketio.sleep(0.01)
            except Exception:
                pass

            if sid in canceled_sids:
                _cleanup_request_dir(request_dir)
                return

            print("Starting audio transcription")
            socketio.emit('progress', {'data': 'Extracting and transcribing audio...', 'progress': 80}, room=sid)
            socketio.sleep(0.1)
            transcribe_video(video_path, request_dir)
            print("Audio transcription completed")
        
        if sid in canceled_sids:
            _cleanup_request_dir(request_dir)
            return

        print("Starting Gemini parsing")
        socketio.emit('progress', {'data': 'Generating final listing with AI...', 'progress': 95}, room=sid)
        socketio.sleep(0.1)
        try:
            parsed_content = parse_content(shortcode, request_dir)
            print("Gemini parsing completed successfully")
        except Exception as e:
            print(f"Error in parse_content: {e}")
            # Create fallback content
            caption_text = ""
            try:
                with open(os.path.join(request_dir, 'caption.txt'), 'r', encoding='utf-8') as cf:
                    caption_text = cf.read()
            except Exception:
                pass
            transcript_text = ""
            try:
                with open(os.path.join(request_dir, 'transcript.txt'), 'r', encoding='utf-8') as tf:
                    transcript_text = tf.read()
            except Exception:
                pass
            parsed_content = _placeholder_result(caption_text, transcript_text)
            print("Using fallback content due to Gemini error")
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

        # Update index for cache reuse
        idx = _read_index()
        idx[shortcode] = {"request_id": request_id, "ts": time.time()}
        _write_index(idx)

        final_images_dir = os.path.join(request_dir, "relevant_final")
        final_images = []
        if os.path.exists(final_images_dir):
            final_images = [f"/image/{request_id}/{f}" for f in sorted(os.listdir(final_images_dir))[:30]]

        expiration_time = datetime.utcnow() + timedelta(seconds=DATA_TTL_SECONDS)
        
        print(f"Emitting final result to sid: {sid}")
        socketio.emit('result', {
            'structured_content': parsed_content,
            'images': final_images,
            'request_id': request_id,
            'expiration_timestamp': expiration_time.isoformat() + 'Z',
            'expires_in_seconds': DATA_TTL_SECONDS
        }, room=sid)
        
        socketio.sleep(0.1)
        print(f"Processing completed successfully for sid: {sid}")

    except Exception as e:
        # Send placeholder result instead of raw error
        try:
            caption_text = ""
            try:
                with open(os.path.join(request_dir, 'caption.txt'), 'r', encoding='utf-8') as cf:
                    caption_text = cf.read()
            except Exception:
                pass
            transcript_text = ""
            try:
                with open(os.path.join(request_dir, 'transcript.txt'), 'r', encoding='utf-8') as tf:
                    transcript_text = tf.read()
            except Exception:
                pass
            expiration_time = datetime.utcnow() + timedelta(seconds=DATA_TTL_SECONDS)
            socketio.emit('result', {
                'structured_content': _placeholder_result(caption_text, transcript_text),
                'images': [],
                'request_id': request_id,
                'expiration_timestamp': expiration_time.isoformat() + 'Z',
                'expires_in_seconds': DATA_TTL_SECONDS
            }, room=sid)
        except Exception:
            socketio.emit('error', {'error': str(e)}, room=sid)
        finally:
            _cleanup_request_dir(request_dir)

@socketio.on('start_processing')
def handle_start_processing(json_data):
    url = json_data.get('url')
    sid = request.sid # Session ID for this client

    match = re.search(r'instagram\.com/p/([A-Za-z0-9_-]+)', url)
    if not match:
        emit('error', {'error': 'Invalid Instagram URL format.'}, room=sid)
        return

    shortcode = match.group(1)

    # Try to serve from cache if still valid
    if _emit_cached_result(sid, shortcode):
        return

    request_id = str(uuid.uuid4())
    request_dir = os.path.join(TEMP_PROCESSING_DIR, request_id)
    os.makedirs(request_dir, exist_ok=True)

    # Immediately notify frontend that processing has begun
    try:
        socketio.emit('progress', {'data': 'Processing started...', 'progress': 10}, room=sid)
        socketio.sleep(0.05)
    except Exception:
        pass

    # Register sid to request mapping; clear any previous canceled flag
    canceled_sids.discard(sid)
    sid_to_request[sid] = {"request_id": request_id, "request_dir": request_dir}

    # Offload the long-running task to a background thread
    socketio.start_background_task(process_instagram_post_sync, sid, shortcode, request_id, request_dir)


@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    canceled_sids.add(sid)
    info = sid_to_request.pop(sid, None)
    if info:
        _cleanup_request_dir(info.get("request_dir"))

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)