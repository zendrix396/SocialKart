import os
import json
import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv
from PIL import Image
import io

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def parse_content(shortcode, request_dir):
    caption = ""
    caption_path = os.path.join(request_dir, "caption.txt")
    if os.path.exists(caption_path):
        with open(caption_path, 'r', encoding='utf-8') as f:
            caption = f.read()

    transcript = ""
    transcript_path = os.path.join(request_dir, "transcript.txt")
    if os.path.exists(transcript_path):
        with open(transcript_path, 'r', encoding='utf-8') as f:
            transcript = f.read()
    
    image_parts = []
    final_images_dir = os.path.join(request_dir, "relevant_final")
    if os.path.exists(final_images_dir):
        image_files = sorted([f for f in os.listdir(final_images_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))])
        for image_file in image_files:
            image_path = os.path.join(final_images_dir, image_file)
            try:
                with Image.open(image_path) as img:
                    img = img.convert("RGB")
                    img_buffer = io.BytesIO()
                    img.save(img_buffer, format='PNG')
                    img_bytes = img_buffer.getvalue()
                    image_part = types.Part.from_bytes(
                        mime_type="image/png",
                        data=img_bytes
                    )
                    image_parts.append(image_part)
            except Exception:
                continue
    
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        prompt_text = f"""You are an expert e-commerce and marketing assistant. Your task is to analyze the content of a social media post (caption, transcript, and images) and generate a structured, comprehensive product listing in JSON format.

Return ONLY the JSON object, with no markdown formatting or any other text outside the JSON.

**Your primary goal is to create a schema that is highly relevant to the product being advertised.** Do NOT use generic placeholders like "Brand", "Dimensions", "Material", etc., unless they are directly applicable.

**Core Schema Requirements (Always Include):**
- "product_name": A clear, descriptive, and marketable name for the product or service.
- "description": A detailed and compelling product description that highlights key benefits and features.
- "key_features": An array of strings listing the most important selling points.
- "target_audience": A string describing the primary customer segment.
- "seo_keywords": An array of 5-10 relevant keywords for search engine optimization.

**Dynamic Schema Generation Instructions:**
- Analyze the product type first and name the details object accordingly (e.g., "technical_details", "package_inclusions", "nutritional_info", "software_requirements").
- Populate only relevant keys based on the provided content. Omit anything not present.

Post Caption:
{caption}

Audio Transcript:
{transcript}
"""

        content_parts = []
        for img in image_parts:
            content_parts.append(img)
        content_parts.append(types.Part.from_text(text=prompt_text))

        contents = [types.Content(role="user", parts=content_parts)]

        generate_content_config = types.GenerateContentConfig()

        full_response = ""
        for chunk in client.models.generate_content_stream(
            model="gemini-2.0-flash",
            contents=contents,
            config=generate_content_config,
        ):
            if chunk.text:
                full_response += chunk.text
        
        generated_text = full_response.strip()
        if generated_text.startswith("```json"):
            generated_text = generated_text[7:]
        if generated_text.endswith("```"):
            generated_text = generated_text[:-3]
        generated_text = generated_text.strip()

        try:
            parsed_json = json.loads(generated_text)
            return parsed_json
        except json.JSONDecodeError:
            # Best-effort recovery: try to locate the first and last braces
            start = generated_text.find("{")
            end = generated_text.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(generated_text[start:end+1])
                except Exception:
                    pass
            # Fallback minimal structure
            return {
                "product_name": "Generated Listing",
                "description": caption or transcript,
                "key_features": [],
                "target_audience": "",
                "seo_keywords": []
            }

    except Exception as e:
        return {"error": "Failed to generate content", "details": str(e)}

if __name__ == '__main__':
    # Test with a specific shortcode
    test_shortcode = "DNSNq6bR635"  # Replace with actual shortcode for testing
    result = parse_content(test_shortcode)
    print("\n--- Generated Content ---")
    print(result)