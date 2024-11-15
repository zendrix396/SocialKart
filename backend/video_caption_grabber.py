import instaloader
import os
import glob

def grab_post(shortcode, posts_dir):
    print(f"Starting to grab post with shortcode: {shortcode}")
    L = instaloader.Instaloader()
    L.download_video_thumbnails = False
    L.download_geotags = False
    L.download_comments = False
    L.save_metadata = False
    L.download_pictures = False

    try:
        post = instaloader.Post.from_shortcode(L.context, shortcode)
        target_dir = f"posts/post_{shortcode}"
        L.dirname_pattern = f"posts/post_{shortcode}"
        L.download_post(post, target=shortcode)
        print(f"Post downloaded successfully: {target_dir}")

        video_files = glob.glob(os.path.join(target_dir, "*.mp4"))
        if video_files:
            os.rename(video_files[0], os.path.join(target_dir, "video.mp4"))
            print("Video renamed to video.mp4")

        caption_files = glob.glob(os.path.join(target_dir, "*.txt"))
        if caption_files:
            os.rename(caption_files[0], os.path.join(target_dir, "caption.txt"))
            print("Caption renamed to caption.txt")

    except Exception as e:
        print(f"An error occurred in grabbing post: {e}")
        raise e