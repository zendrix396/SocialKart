import cv2
import os
def video_to_frames(video_path, frames_dir, shortcode, request_id, progress_lock, progress_store):
    output_folder = os.path.join(frames_dir, f'output_frames_{shortcode}')
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frame_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        output_file = os.path.join(output_folder, f"frame_{frame_count:04d}.png")
        cv2.imwrite(output_file, frame)
        frame_count += 1
        
        # Update progress (30% total allocated for this step)
        progress = 10 + (frame_count / total_frames * 30)
        with progress_lock:
            progress_store[request_id]["progress"] = min(40, progress)
            
    cap.release()
    print(f"Frames extracted and saved to {output_folder}")