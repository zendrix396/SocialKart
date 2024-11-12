import os

def parse_content(shortcode, posts_dir):
    caption_path = os.path.join(posts_dir, f'post_{shortcode}', 'caption.txt')
    transcribed_caption_path = os.path.join(posts_dir, f'post_{shortcode}', 'captions.txt')
    try:
        with open(caption_path, 'r', encoding='utf-8') as f:
            instagram_caption = f.read()
    except FileNotFoundError:
        instagram_caption = 'No Instagram caption found.'
    except UnicodeDecodeError:
        try:
            with open(caption_path, 'r', encoding='latin-1') as f:
                instagram_caption = f.read()
        except:
            instagram_caption = 'Error reading Instagram caption.'
    try:
        with open(transcribed_caption_path, 'r', encoding='utf-8') as f:
            transcribed_text = f.read()
    except FileNotFoundError:
        transcribed_text = 'No transcribed text found.'
    except UnicodeDecodeError:
        try:
            with open(transcribed_caption_path, 'r', encoding='latin-1') as f:
                transcribed_text = f.read()
        except:
            transcribed_text = 'Error reading transcribed text.'
    parsed_content = f"Instagram Caption:\n{instagram_caption}\n\nTranscribed Text:\n{transcribed_text}"
    return parsed_content