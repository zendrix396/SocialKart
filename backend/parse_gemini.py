import requests
import os
import threading
import time
from pathlib import Path

def parse_content(shortcode, posts_dir):
    def read_file_safe(file_path):
        """Helper function to safely read files with different encodings"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            try:
                with open(file_path, 'r', encoding='latin-1') as f:
                    return f.read()
            except:
                return None
        except FileNotFoundError:
            return None

    # Read caption and transcribed text
    post_dir = Path(posts_dir) / f'post_{shortcode}'
    caption = read_file_safe(post_dir / 'caption.txt') or 'No Instagram caption found.'
    transcription = read_file_safe(post_dir / 'captions.txt') or 'No transcribed text found.'

    # Prepare prompt for Claude
    prompt = f"""Generate a comprehensive Amazon product listing based on the following content:

Instagram Caption:
{caption}

Video Transcription:
{transcription}

Please format the response as a complete Amazon product listing including:
1. Product Title
2. Key Features/Bullet Points
3. Product Description
4. Technical Details
5. Additional Information
"""

    # Setup Claude AI request
    url = "http://127.0.0.1:8444/v1/chat/completions"
    headers = {"Content-Type": "application/json"}
    
    messages = [
        {"role": "system", "content": "You are an expert at creating professional Amazon product listings. Convert social media content into detailed, well-structured product listings."},
        {"role": "user", "content": prompt}
    ]
    
    data = {
        "model": "claude-3-haiku-20240307",
        "messages": messages,
        "max_tokens": 1024,
        "stream": False
    }

    try:
        # Start Claude endpoint if not running
        if not hasattr(parse_content, 'claude_started'):
            threading.Thread(target=lambda: os.system("node clewd.js"), daemon=True).start()
            time.sleep(3)  # Wait for endpoint to start
            parse_content.claude_started = True

        # Make request to Claude
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            result = response.json()
            generated_listing = result['choices'][0]['message']['content']
            return generated_listing
        else:
            return f"Error generating listing: {response.status_code} - {response.text}"

    except Exception as e:
        return f"Error processing request: {str(e)}"