import os
import shutil
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from video_caption_grabber import grab_post
from separate_frames import video_to_frames
from classify_frames import classify_and_move_images
from transcribe_video import transcribe_video
import time
from parse_gemini import parse_content
app = Flask(__name__)
CORS(app)
os.makedirs("posts", exist_ok=True)
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

    try:
        grab_post(shortcode, "posts")
        video_path = f"posts/post_{shortcode}/video.mp4"
        video_to_frames(video_path, "posts", shortcode)
        classify_and_move_images(shortcode, "posts")
        transcribe_video(video_path, "posts", shortcode)
        parsed_content = parse_content(shortcode, "posts")
        time.sleep(3)
        relevant_dir = f"posts/output_frames_{shortcode}/relevant"
        images = [img for img in os.listdir(relevant_dir) if img.lower().endswith(('.png', '.jpg', '.jpeg'))]
        selected_images = images # TODO: IMPLEMENT RANDOM
        image_urls = []
        for img in selected_images:
            image_path = f"{relevant_dir}/{img}"
            with open(image_path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                image_urls.append(encoded_string)
        print(f"Number of images being sent: {len(image_urls)}")
        return jsonify({
            'parsed_content': parsed_content,
            'images': image_urls
        })

    except Exception as e:
        shutil.rmtree("/posts", ignore_errors=True)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)