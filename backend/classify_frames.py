import os
import shutil
from keras.models import load_model
from keras.layers import DepthwiseConv2D
from PIL import Image, ImageOps
import numpy as np
import re

class CustomDepthwiseConv2D(DepthwiseConv2D):
    def __init__(self, **kwargs):
        if 'groups' in kwargs:
            del kwargs['groups']
        super().__init__(**kwargs)

model = load_model("keras_model.h5", compile=False, custom_objects={'DepthwiseConv2D': CustomDepthwiseConv2D})
class_names = open("labels.txt", "r").readlines()

def get_frame_number(filename):
    # Extract frame number from filename (assuming format like "frame_001.jpg")
    match = re.search(r'frame_(\d+)', filename)
    if match:
        return int(match.group(1))
    return 0

def classify_and_move_images(shortcode, frames_base_dir, request_id, progress_lock, progress_store):
    input_dir = os.path.join(frames_base_dir, f"output_frames_{shortcode}")
    relevant_dir = os.path.join(input_dir, "relevant")
    non_relevant_dir = os.path.join(input_dir, "non-relevant")
    os.makedirs(relevant_dir, exist_ok=True)
    os.makedirs(non_relevant_dir, exist_ok=True)
    
    # Get all images and sort them by frame number
    images = [f for f in os.listdir(input_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    images.sort(key=get_frame_number)
    
    # Filter for every 30th frame
    images_to_process = [img for img in images if get_frame_number(img) % 30 == 1]
    total_images = len(images_to_process)
    processed_images = 0
    
    for filename in images_to_process:
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            image_path = os.path.join(input_dir, filename)
            
            processed_images += 1
            # Update progress (40% allocated for this step)
            progress = 40 + (processed_images / total_images * 40)
            with progress_lock:
                progress_store[request_id]["progress"] = min(80, progress)

            # Classification logic
            data = np.ndarray(shape=(1, 224, 224, 3), dtype=np.float32)
            image = Image.open(image_path).convert("RGB")
            size = (224, 224)
            image = ImageOps.fit(image, size, Image.Resampling.LANCZOS)
            image_array = np.asarray(image)
            normalized_image_array = (image_array.astype(np.float32) / 127.5) - 1
            data[0] = normalized_image_array
            
            prediction = model.predict(data)
            index = np.argmax(prediction)
            class_name = class_names[index].strip()
            confidence_score = prediction[0][index]
            
            print(f"Image: {filename} - Class: {class_name} - Confidence Score: {confidence_score}")
            
            if index == 0:
                shutil.move(image_path, os.path.join(relevant_dir, filename))
            elif index == 1:
                shutil.move(image_path, os.path.join(non_relevant_dir, filename))

    print("Frame classification complete.")