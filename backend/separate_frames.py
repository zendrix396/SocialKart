import cv2
import os

def video_to_frames(video_path, frames_dir, shortcode):
    output_folder = os.path.join(frames_dir, f'output_frames_{shortcode}')
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return

    frame_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        if frame_count % 40 == 0:
            output_file = os.path.join(output_folder, f"frame_{frame_count:04d}.png")
            cv2.imwrite(output_file, frame)
                
        frame_count += 1
            
    cap.release()