import instaloader
import os
import glob
import re
import time
import shutil
from functools import lru_cache
from dotenv import load_dotenv
import tempfile
from pathlib import Path

load_dotenv()

INSTAGRAM_USERNAME = os.getenv("INSTAGRAM_USERNAME")
INSTAGRAM_PASSWORD = os.getenv("INSTAGRAM_PASSWORD")
INSTAGRAM_SESSIONID = "76199069886%3AA8wSSxD8DU1stJ%3A14%3AAYff686tQsmQckbX9l5nEescOKKbXey1IFlqxT0AaA"
INSTAGRAM_USER_ID = "76199069886"
INSTAGRAM_USER_AGENT = os.getenv(
    "INSTAGRAM_USER_AGENT",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
).strip()
SESSIONS_DIR = Path(__file__).resolve().parent / ".sessions"
SESSIONS_DIR.mkdir(exist_ok=True)
SESSION_FILE = (
    SESSIONS_DIR /
    f"{INSTAGRAM_USERNAME}.session") if INSTAGRAM_USERNAME else None
LEGACY_SESSION_FILE = (
    SESSIONS_DIR /
    f"session-{INSTAGRAM_USERNAME}") if INSTAGRAM_USERNAME else None


@lru_cache(maxsize=None)
def get_instaloader_session():
    """Initializes and logs into a reusable Instaloader session."""
    print("Initializing new Instaloader session...")
    L = instaloader.Instaloader(download_pictures=True,
                                download_videos=True,
                                download_video_thumbnails=False,
                                download_geotags=False,
                                download_comments=False,
                                save_metadata=False,
                                post_metadata_txt_pattern="{caption}",
                                max_connection_attempts=3,
                                request_timeout=30)

    # Stabilize UA
    try:
        L.context._session.headers.update({"User-Agent": INSTAGRAM_USER_AGENT})
    except Exception:
        pass

    # 1) Load from our pinned session files
    for candidate in [SESSION_FILE, LEGACY_SESSION_FILE]:
        if INSTAGRAM_USERNAME and candidate and candidate.exists():
            try:
                L.load_session_from_file(username=INSTAGRAM_USERNAME,
                                         filename=str(candidate))
                if L.test_login() is None:
                    raise RuntimeError("Invalid session file")
                print(f"Loaded Instaloader session from {candidate}")
                # If legacy name is used, persist to canonical name
                if candidate is LEGACY_SESSION_FILE and SESSION_FILE:
                    L.save_session_to_file(str(SESSION_FILE))
                return L
            except Exception as e:
                print(f"Failed to load session from {candidate}: {e}")

    # 2) Optional cookie-based refresh (no password)
    if INSTAGRAM_SESSIONID:
        try:
            L.context._session.cookies.set("sessionid",
                                           INSTAGRAM_SESSIONID,
                                           domain=".instagram.com")
            if INSTAGRAM_USER_ID:
                L.context._session.cookies.set("ds_user_id",
                                               INSTAGRAM_USER_ID,
                                               domain=".instagram.com")
            logged_in_as = L.test_login()
            if logged_in_as is None:
                raise RuntimeError("Cookie invalid or expired")
            print(f"Cookie-based login succeeded as: {logged_in_as}")
            if INSTAGRAM_USERNAME and SESSION_FILE:
                L.save_session_to_file(str(SESSION_FILE))
                print(f"Session saved to {SESSION_FILE}")
            return L
        except Exception as e:
            print(f"Cookie login failed: {e}")

    # 3) Password-based login fallback to create a session file if none exists
    if INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD:
        try:
            print("Attempting password-based login to create session file...")
            L.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD)
            if SESSION_FILE:
                L.save_session_to_file(str(SESSION_FILE))
                print(f"Session saved to {SESSION_FILE}")
            return L
        except Exception as e:
            print(f"Password login failed: {e}")

    # 4) If everything fails
    raise RuntimeError(
        "No valid Instagram session. Provide backend/.sessions/<username>.session, set INSTAGRAM_SESSIONID in .env, or set INSTAGRAM_USERNAME/INSTAGRAM_PASSWORD for fallback login."
    )


class ProductPostFinder:

    def __init__(self):
        self.L = instaloader.Instaloader()
        self.L.download_video_thumbnails = False
        self.L.download_geotags = False
        self.L.download_comments = False
        self.L.save_metadata = False
        self.L.download_pictures = True

    def login(self, username, password):
        try:
            self.L.login(username, password)
            return True
        except Exception as e:
            print(f"Login failed: {e}")
            return False

    def search_product_posts(self, product_name, max_posts=10):
        found_posts = []
        search_urls = self._generate_search_tags(product_name)

        try:
            for url in search_urls:
                time.sleep(2)
                try:
                    response = self.L.context.get_json(url)

                    if not response or 'data' not in response:
                        continue

                    posts = response.get('data', {}).get('hashtag', {}).get(
                        'edge_hashtag_to_media', {}).get('edges', [])
                    for post_data in posts:
                        if len(found_posts) >= max_posts:
                            break

                        post = post_data.get('node')
                        if not post:
                            continue

                        shortcode = post.get('shortcode')
                        if not shortcode:
                            continue

                        try:
                            full_post = instaloader.Post.from_shortcode(
                                self.L.context, shortcode)
                            if self._is_relevant_sponsored_post(
                                    full_post, product_name):
                                found_posts.append(full_post)
                        except Exception as e:
                            print(f"Error fetching post {shortcode}: {e}")
                            continue

                except Exception as e:
                    print(f"Error processing URL {url}: {e}")
                    return "Feature under Development!"

            return found_posts

        except Exception as e:
            print(f"Error searching posts: {e}")
            return "Feature under Development!"

    def _generate_search_tags(self, product_name):
        base_tag = re.sub(r'[^a-zA-Z0-9]', '', product_name.lower())

        search_url_template = "https://www.instagram.com/explore/search/keyword/?q=%23{}"
        tags = [
            base_tag, f"{base_tag}review", f"{base_tag}product",
            f"sponsored{base_tag}", "productreview", "sponsoredpost", "ad",
            "sponsored"
        ]
        search_urls = [search_url_template.format(tag) for tag in tags]
        return search_urls

    def _is_relevant_sponsored_post(self, post, product_name):
        if not post.caption:
            return False
        caption_lower = post.caption.lower()
        product_lower = product_name.lower()
        sponsored_indicators = [
            '#ad', '#sponsored', '#sponsoredpost', '#advertisement',
            'paid partnership', 'sponsored by', 'partner'
        ]
        is_sponsored = any(indicator in caption_lower
                           for indicator in sponsored_indicators)
        contains_product = product_lower in caption_lower
        return is_sponsored and contains_product


def grab_post(shortcode, request_dir):
    print(f"Starting to grab post with shortcode: {shortcode}")
    L = get_instaloader_session()
    if not L:
        raise Exception("Failed to initialize Instaloader session.")

    try:
        post = instaloader.Post.from_shortcode(L.context, shortcode)

        # All files will be placed inside the unique request_dir
        L.dirname_pattern = request_dir

        os.makedirs(request_dir, exist_ok=True)

        # Persist caption explicitly to ensure correctness regardless of Instaloader sidecar behavior
        try:
            caption_text = post.caption or ""
        except Exception:
            caption_text = ""
        with open(os.path.join(request_dir, "caption.txt"),
                  "w",
                  encoding="utf-8") as cf:
            cf.write(caption_text)

        print(f"Downloading post {shortcode}...")
        L.download_post(post, target=shortcode)
        print(f"Post downloaded successfully into: {request_dir}")

        video_path = None
        if post.is_video:
            video_files = glob.glob(os.path.join(request_dir, "*.mp4"))
            if video_files:
                # We move the video to a predictable name inside the request_dir for later use
                final_video_path = os.path.join(request_dir, "video.mp4")
                os.replace(video_files[0], final_video_path)
                video_path = final_video_path
                print(f"Video file saved to {final_video_path}")

        image_files = glob.glob(os.path.join(request_dir, "*.jpg"))
        print(
            f"Found {len(image_files)} image files to be used as fallback if video frames fail."
        )
        # No need to move/copy images here anymore as they are not used if there's a video.
        # If it's an image post, they will be used by parse_content directly from request_dir.

        # We already wrote caption.txt explicitly. Ignore any additional txt sidecars created by Instaloader.

        post_info = {'is_video': post.is_video, 'video_path': video_path}

        print(f"Post info: {post_info}")
        return post_info

    except Exception as e:
        print(f"An error occurred in grabbing post: {e}")
        import traceback
        traceback.print_exc()
        raise e


def process_product_request(product_name, base_dir):
    finder = ProductPostFinder()

    # Using the cached global session for login
    L = get_instaloader_session()
    if not L:
        return {"error": "Failed to login to Instagram"}

    try:
        posts = finder.search_product_posts(product_name)

        if posts == "Feature under Development!":
            return {"error": "Product search is currently under development."}

        if not posts:
            return {"error": "No relevant sponsored posts found"}

        best_post = max(posts, key=lambda p: p.likes)

        post_data = grab_post(best_post.shortcode, base_dir)

        return {"success": True, "post_data": post_data}

    except Exception as e:
        return {"error": f"Error processing request: {e}"}


def process_product_background(product_name, request_id, set_progress):
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            set_progress(
                request_id, {
                    "progress": "0",
                    "current_step": "Initializing product search...",
                    "error": ""
                })

            set_progress(request_id, {
                "progress": "20",
                "current_step": "Searching for product posts..."
            })

            # We don't need username/password here as the session is cached
            result = process_product_request(product_name, temp_dir)

            if result.get("error"):
                set_progress(request_id, {"error": result["error"]})
            else:
                # This endpoint doesn't generate a final result in the same way.
                # It finds a post, downloads it, but what should be returned?
                # For now, let's just mark it as complete.
                # A more complete implementation would need to decide what to do with the downloaded post data.
                set_progress(
                    request_id, {
                        "progress": "100",
                        "current_step": "Processing complete!",
                        "result_ready": "true"
                    })
                # We could also store the result data in Redis if needed.
                # set_result(request_id, result)

        except Exception as e:
            set_progress(request_id, {"error": str(e), "progress": "0"})
