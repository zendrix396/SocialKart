from PIL import Image
import io
import base64


def process_image(image_path, max_size=1024):
    """Process and resize image if needed"""
    try:
        with Image.open(image_path) as img:
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize if too large
            if img.width > max_size or img.height > max_size:
                ratio = max_size / max(img.width, img.height)
                new_size = (int(img.width * ratio), int(img.height * ratio))
                img = img.resize(new_size, Image.LANCZOS)
            
            # Save to bytes
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            return base64.b64encode(buffer.getvalue()).decode('utf-8')
    except Exception as e:
        print(f"Error processing image {image_path}: {str(e)}")
        return None
def parse_claude_response(content):
    print("\n=== Parsing Content Start ===")
    print(content)
    print("=== Parsing Content End ===\n")
    
    sections = content.split('----------')
    
    # Helper function to process bullet points
    def process_bullet_points(text):
        return [
            line.replace('-', '').strip()
            for line in text.split('\n')
            if line.strip() and line.strip().startswith('-')
        ]

    # Helper function to process technical details
    def process_technical_details(text):
        details = {}
        for line in text.split('\n'):
            if line.strip() and ':' in line and line.strip().startswith('-'):
                key, value = line.replace('-', '').split(':', 1)
                details[key.strip()] = value.strip()
        return details

    parsed_data = {
        'title': sections[0].strip(),
        'key_features': process_bullet_points(sections[1]),
        'description': sections[2].strip(),
        'technical_details': process_technical_details(sections[3]),
        'search_terms': process_bullet_points(sections[4])
    }

    # Print formatted parsed data for verification
    print("\n=== Parsed Data Structure ===")
    print("Title:", parsed_data['title'])
    print("\nKey Features:")
    for feature in parsed_data['key_features']:
        print(f"• {feature}")
    print("\nDescription:", parsed_data['description'])
    print("\nTechnical Details:")
    for key, value in parsed_data['technical_details'].items():
        print(f"• {key}: {value}")
    print("\nSearch Terms:")
    for term in parsed_data['search_terms']:
        print(f"• {term}")
    print("=== End of Parsed Data ===\n")

    return parsed_data