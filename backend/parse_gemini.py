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
    prompt = f"""[JUST RESPOND WITH THE LISTING DONT TALK TO ME, JUST HAVE LISTING IN YOUR RESPONSE] As an Amazon listing expert, create a compliant product listing from this social media content that meets Amazon's quality standards:

Instagram Caption:
{caption}

Video Transcription:
{transcription}

Generate a structured listing with EXACTLY [JUST KEEP THE ONE WHERE YOU ARE NOT SURE AS PLACEHOLDERS]:

1. Product Title (max 200 characters)
- Format: [Brand] + [Model] + [Product Type] + [Key Feature]
- Example: "ArjunWellness Pro-X Smart Fitness Tracker with Heart Rate Monitor"

2. Five (5) Key Features (bullet points)
- Start each with a benefit
- No promotional language
- Factual, specific details only

3. Product Description
- No HTML tags
- No promotional claims
- Structured in clear paragraphs
- Focus on technical specifications
- Avoid subjective statements

4. Technical Details (as key-value pairs)
- Brand:
- Model:
- Dimensions:
- Weight:
- Battery Life:
- Connectivity:
- Compatibility:
- Warranty:

5. Search Terms (5 relevant keywords)
- No brand names
- No subjective terms
- No competitor references

Ensure all content:
- Contains no medical claims
- Follows Amazon's restricted keywords policy
- Uses factual, verifiable information only
- Complies with category-specific requirements
- Maintains professional language
"""

    # Setup Claude AI request
    url = "http://127.0.0.1:8444/v1/chat/completions"
    headers = {"Content-Type": "application/json"}
    
    messages = [
        {"role": "system", "content": "You are an expert at creating professional Amazon product listings. Convert social media content into detailed, well-structured product listings."},
        {"role": "user", "content": prompt}
    ]
    
    data = {
        "model": "claude-3-5-sonnet-20241022",
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