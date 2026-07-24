import os
import re
import json
import time
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

ZORAAHUB_API = "https://api.zoraahub.com/fetch.php"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Content-Type": "application/json",
    "Origin": "https://downreels.com",
    "Referer": "https://downreels.com/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site",
}


def _extract_media_links(data):
    """Recursively search JSON for download links."""
    links = []

    def search_zoraahub(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if isinstance(v, str) and "media.zoraahub.com/download.php" in v:
                    links.append(v)
                elif isinstance(v, (dict, list)):
                    search_zoraahub(v)
        elif isinstance(obj, list):
            for item in obj:
                search_zoraahub(item)

    search_zoraahub(data)

    if not links:

        def search_direct(obj):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if isinstance(v, str) and "cdninstagram.com" in v:
                        if k.lower() in [
                            "url",
                            "video_url",
                            "display_url",
                            "download_url",
                            "link",
                        ]:
                            links.append(v)
                    elif isinstance(v, (dict, list)):
                        search_direct(v)
            elif isinstance(obj, list):
                for item in obj:
                    search_direct(item)

        search_direct(data)

    return list(dict.fromkeys(links))


def _extract_caption(data):
    """Try to pull caption text from the API response."""
    caption_keys = ["caption", "description", "title", "text", "caption_text"]

    def search(obj, depth=0):
        if depth > 8:
            return None
        if isinstance(obj, dict):
            for k in caption_keys:
                if k in obj and isinstance(obj[k], str) and len(obj[k]) > 10:
                    return obj[k]
            for v in obj.values():
                result = search(v, depth + 1)
                if result:
                    return result
        elif isinstance(obj, list):
            for item in obj:
                result = search(item, depth + 1)
                if result:
                    return result
        return None

    return search(data) or ""


def grab_post(url, request_dir):
    """
    Download an Instagram post via Zoraahub API (no login needed).
    Accepts full Instagram URL. Returns {"is_video": bool, "video_path": str|None}.
    """
    print(f"Fetching media for URL: {url}")
    os.makedirs(request_dir, exist_ok=True)

    # 1. Fetch metadata
    try:
        resp = requests.post(ZORAAHUB_API, json={"url": url}, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"API request failed: {e}")
        raise

    # 2. Extract download links
    media_urls = _extract_media_links(data)
    if not media_urls:
        print(f"No media found. Raw response snippet: {json.dumps(data, indent=2)[:500]}")
        raise Exception("No downloadable media found in API response")

    print(f"Found {len(media_urls)} media file(s)")

    # 3. Extract caption
    caption = _extract_caption(data)
    caption_path = os.path.join(request_dir, "caption.txt")
    with open(caption_path, "w", encoding="utf-8") as f:
        f.write(caption)
    print(f"Caption saved ({len(caption)} chars)")

    # 4. Download media files
    video_path = None
    dl_headers = {k: v for k, v in HEADERS.items() if k != "Content-Type"}

    for idx, href in enumerate(media_urls):
        ext = ".mp4" if ".mp4" in href or "video" in href.lower() else ".jpg"
        if ".webp" in href:
            ext = ".webp"

        filename = f"media_{idx + 1}{ext}"
        filepath = os.path.join(request_dir, filename)

        try:
            r = requests.get(href, headers=dl_headers, stream=True, timeout=60)
            r.raise_for_status()
            with open(filepath, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
            file_size = os.path.getsize(filepath)
            print(f"Downloaded: {filename} ({file_size / 1024:.1f} KB)")

            if file_size < 1024:
                print(f"Warning: {filename} seems too small ({file_size} bytes), might be corrupt")
                os.remove(filepath)
                continue

            if ext == ".mp4" and video_path is None:
                # Rename to standard name
                final_video = os.path.join(request_dir, "video.mp4")
                os.replace(filepath, final_video)
                video_path = final_video
        except Exception as e:
            print(f"Failed to download {filename}: {e}")

    is_video = video_path is not None
    print(f"Post info: is_video={is_video}, video_path={video_path}")
    return {"is_video": is_video, "video_path": video_path}
