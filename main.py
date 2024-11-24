import instaloader
import sys

def get_post_caption(shortcode):
    try:
        # Initialize Instaloader
        L = instaloader.Instaloader()
        
        # Get post from shortcode
        post = instaloader.Post.from_shortcode(L.context, shortcode)
        
        # Get and return the caption
        if post.caption:
            return post.caption
        else:
            return "No caption found for this post."
            
    except instaloader.exceptions.InstaloaderException as e:
        return f"Instaloader error: {str(e)}"
    except Exception as e:
        return f"Error: {str(e)}"

def main():
    # Get shortcode from user
    shortcode = input("Enter Instagram post shortcode: ")
    
    # Get and print caption
    caption = get_post_caption(shortcode)
    print("\nPost Caption:")
    print("-" * 50)
    print(caption)
    print("-" * 50)

if __name__ == "__main__":
    main()