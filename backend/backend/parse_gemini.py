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

        static_instructions = """
You are an expert e-commerce and marketing assistant. Analyze the caption, audio transcript, and images of a social media post and return a comprehensive product listing as pure JSON.

Return ONLY the JSON object, with no markdown or extra text.

Required top-level keys (always present):
- product_name: Clear, marketable product or service name.
- description: Detailed, compelling description with concrete details if available.
- key_features: Array of concise bullet points highlighting benefits.
- target_audience: Who this offering is for.
- seo_keywords: 5-10 relevant search keywords.
- technical_details: An object of concrete attributes. This object MUST NOT be empty.
- technical_details_schema: An object describing the structure of technical_details with a "properties" object. This MUST include property names with descriptions and, when applicable, nominal types (string, number, boolean, array, object). Example shape:
  {
    "category": "jewelry",
    "properties": {
      "material": {"type": "string", "description": "Metal type/purity"},
      "gemstone": {"type": "string", "description": "Type/shape/carat/clarity if visible"},
      "dimensions": {"type": "string", "description": "Size/length/width/height where applicable"}
    }
  }

Rules for technical_details and schema:
- First infer the category (e.g., travel package, jewelry, apparel, electronics, cosmetics, home decor, software/service, food/beverage, fitness, education, real estate, automotive, etc.) and include it in technical_details_schema.category.
- Fill technical_details with concrete specs from caption/transcript/images. Prefer measurable attributes (dimensions, weight, capacity, size, material, color, finish, gemstone type/carat/clarity, metal purity, warranty, duration, accommodation class, itinerary, OS/version, compatibility, ingredients, SPF/PA rating, battery life, refresh rate, storage/RAM, etc.).
- If exact numbers are unavailable but attributes are visually implied, include descriptive values without fabricating exact numbers (e.g., "yellow gold finish", "round-cut stone", "compact form factor").
- Ensure every key in technical_details has a corresponding entry in technical_details_schema.properties with type and description.

Image-derived cues (when visible):
- Extract visible labels, packaging sizes, display sizes, form factor, ports, connectors, patterns, gemstone shapes/cuts, clasp types, ring size guides, etc.
"""

        prompt_text = (
            static_instructions
            + "\n\nPost Caption:\n" + (caption or "")
            + "\n\nAudio Transcript:\n" + (transcript or "")
        )

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
                "seo_keywords": [],
                "technical_details": {},
                "technical_details_schema": {"category": "", "properties": {}}
            }

    except Exception as e:
        return {"error": "Failed to generate content", "details": str(e)}

if __name__ == '__main__':
    # Test with a specific shortcode
    test_shortcode = "DNSNq6bR635"  # Replace with actual shortcode for testing
    result = parse_content(test_shortcode)
    print("\n--- Generated Content ---")
    print(result)