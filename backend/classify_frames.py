import os
import shutil
from keras.models import load_model
from keras.layers import DepthwiseConv2D
from PIL import Image, ImageOps
import numpy as np

class CustomDepthwiseConv2D(DepthwiseConv2D):
    def __init__(self, **kwargs):
        if 'groups' in kwargs:
            del kwargs['groups']
        super().__init__(**kwargs)

model = load_model("keras_model.h5", compile=False, custom_objects={'DepthwiseConv2D': CustomDepthwiseConv2D})

class_names = open("labels.txt", "r").readlines()

def classify_and_move_images(shortcode, frames_base_dir):
    input_dir = os.path.join(frames_base_dir, f"output_frames_{shortcode}")
    relevant_dir = os.path.join(input_dir, "relevant")
    non_relevant_dir = os.path.join(input_dir, "non-relevant")
    os.makedirs(relevant_dir, exist_ok=True)
    os.makedirs(non_relevant_dir, exist_ok=True)
    for filename in os.listdir(input_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            image_path = os.path.join(input_dir, filename)
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
            if confidence_score > 0.98:
                shutil.move(image_path, os.path.join(non_relevant_dir, filename))
            else:
                shutil.move(image_path, os.path.join(relevant_dir, filename))
    print("Frame classification complete.")