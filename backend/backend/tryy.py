import os
from dotenv import load_dotenv
import instaloader

# Load .env variables into environment
load_dotenv()

INSTAGRAM_USERNAME = os.getenv("INSTAGRAM_USERNAME")
INSTAGRAM_PASSWORD = os.getenv("INSTAGRAM_PASSWORD")
TARGET_PROFILE = "aadyy.singh"

def get_follower_count_from_session():
    L = instaloader.Instaloader()

    try:
        L.load_session_from_file(INSTAGRAM_USERNAME)
        print(f"[SUCCESS] Loaded session from file for '{INSTAGRAM_USERNAME}'.")
    except FileNotFoundError:
        print("[INFO] Session file not found, logging in and saving session file...")
        try:
            L.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD)
            L.save_session_to_file(INSTAGRAM_USERNAME)
            print(f"[SUCCESS] Logged in and saved new session file.")
        except Exception as e:
            print(f"[ERROR] Failed login or save session: {e}")
            return
    except Exception as e:
        print(f"[ERROR] Error loading session: {e}")
        return

    try:
        profile = instaloader.Profile.from_username(L.context, TARGET_PROFILE)
        print(f"[INFO] '{TARGET_PROFILE}' has {profile.followers} followers.")
    except Exception as e:
        print(f"[ERROR] Could not fetch follower count: {e}")

if __name__ == "__main__":
    get_follower_count_from_session()
