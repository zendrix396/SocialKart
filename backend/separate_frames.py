import cv2
import os

def video_to_frames(video_path, frames_dir, shortcode):
    output_folder = os.path.join(frames_dir, f'output_frames_{shortcode}')
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return

    try:
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
    except Exception:
        total_frames = 0

    # Aim to save enough frames to allow selecting 30 relevant ones across the video
    # Save roughly up to 300 frames, spaced evenly; fallback to every frame for short videos
    target_saved_frames = 300
    sample_interval = 10
    if total_frames > 0:
        sample_interval = max(1, total_frames // target_saved_frames)

    frame_index = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_index % sample_interval == 0:
            output_file = os.path.join(output_folder, f"frame_{frame_index:04d}.png")
            cv2.imwrite(output_file, frame)

        frame_index += 1

    cap.release()