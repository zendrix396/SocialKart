# SocialKart ML Training

Binary image classifier for distinguishing ideal vs non-ideal Instagram video frames.

## Architecture
- **Base**: MobileNetV2 (ImageNet pretrained)
- **Head**: Dropout(0.2) -> Linear(1280, 2)
- **Input**: 224x224 RGB
- **Export**: ONNX (onnxruntime compatible)

## Quick Start

### 1. Label frames
```bash
python labeler.py
```
- Enter Instagram URL, press F to keep, J to skip
- Label ~20 posts for a decent baseline

### 2. Train
```bash
python train.py --data_dir ./ideal ./non_ideal --epochs 20
```

## Dataset
Trained on ~20 manually labeled Instagram posts (~600-1000 frames).
More posts = better accuracy. Aim for 50+ for production.
