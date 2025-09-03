import os
import shutil
import onnxruntime
from PIL import Image, ImageOps
import numpy as np
import re

ort_session = onnxruntime.InferenceSession("model.onnx", providers=["CPUExecutionProvider"])
class_names = open("labels.txt", "r").readlines()

def get_frame_number(filename):
    match = re.search(r'frame_(\d+)', filename)
    if match:
        return int(match.group(1))
    return 0

def classify_and_move_images(shortcode, request_dir, frames_dir):
    input_frames_dir = os.path.join(frames_dir, f"output_frames_{shortcode}")
    
    relevant_dir = os.path.join(request_dir, "relevant")
    non_relevant_dir = os.path.join(request_dir, "non-relevant")
    final_relevant_dir = os.path.join(request_dir, "relevant_final")

    os.makedirs(relevant_dir, exist_ok=True)
    os.makedirs(non_relevant_dir, exist_ok=True)
    os.makedirs(final_relevant_dir, exist_ok=True)
    
    if not os.path.isdir(input_frames_dir):
        return

    images = [f for f in os.listdir(input_frames_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    images.sort(key=get_frame_number)
    
    if not images:
        return

    input_name = ort_session.get_inputs()[0].name
    
    all_frames_with_scores = []

    for filename in images:
        image_path = os.path.join(input_frames_dir, filename)
        
        data = np.ndarray(shape=(1, 224, 224, 3), dtype=np.float32)
        try:
            with Image.open(image_path) as image:
                image = image.convert("RGB")
                image = ImageOps.fit(image, (224, 224), Image.Resampling.LANCZOS)
                image_array = np.asarray(image)
                normalized_image_array = (image_array.astype(np.float32) / 127.5) - 1
                data[0] = normalized_image_array
        except Exception:
            continue
        
        ort_inputs = {input_name: data}
        ort_outs = ort_session.run(None, ort_inputs)
        prediction = ort_outs[0]

        relevant_score = prediction[0][0]
        
        all_frames_with_scores.append({
            "filename": filename,
            "score": relevant_score,
            "frame_number": get_frame_number(filename)
        })

    all_frames_with_scores.sort(key=lambda x: x['score'], reverse=True)

    selected_frames = []
    selected_frame_numbers = []
    FRAME_DIFFERENCE_THRESHOLD = 60

    for frame_info in all_frames_with_scores:
        if len(selected_frames) >= 30:
            break

        is_far_enough = True
        for selected_num in selected_frame_numbers:
            if abs(frame_info["frame_number"] - selected_num) < FRAME_DIFFERENCE_THRESHOLD:
                is_far_enough = False
                break
        
        if is_far_enough:
            selected_frames.append(frame_info)
            selected_frame_numbers.append(frame_info["frame_number"])

    # If spacing filter produced fewer than 30, top-up with next best distinct frames
    if len(selected_frames) < 30:
        for frame_info in all_frames_with_scores:
            if len(selected_frames) >= 30:
                break
            if frame_info in selected_frames:
                continue
            is_far_enough = True
            for selected_num in selected_frame_numbers:
                if abs(frame_info["frame_number"] - selected_num) < FRAME_DIFFERENCE_THRESHOLD:
                    is_far_enough = False
                    break
            if is_far_enough:
                selected_frames.append(frame_info)
                selected_frame_numbers.append(frame_info["frame_number"])

    for frame_info in selected_frames:
        src_path = os.path.join(input_frames_dir, frame_info['filename'])
        dest_path = os.path.join(final_relevant_dir, frame_info['filename'])
        if os.path.exists(src_path):
            shutil.copy(src_path, dest_path)
            
    for frame_info in all_frames_with_scores:
        src_path = os.path.join(input_frames_dir, frame_info['filename'])
        if frame_info['score'] > 0.5:
             dest_path = os.path.join(relevant_dir, frame_info['filename'])
        else:
             dest_path = os.path.join(non_relevant_dir, frame_info['filename'])
        if os.path.exists(src_path):
            shutil.copy(src_path, dest_path)