"""
SocialKart Frame Classifier Training Script
============================================
Trains a binary image classifier to distinguish between ideal (relevant)
and non-ideal frames extracted from Instagram video posts.

Architecture: MobileNetV2 (transfer learning) -> Binary classification head
Output: ONNX model compatible with onnxruntime (input: 224x224 RGB)

Usage:
    python train.py --data_dir ./ideal ./non_ideal --epochs 20 --output ../backend/model.onnx

Dataset structure:
    ideal/       - Frames that represent good product showcase angles
    non_ideal/   - Frames that are blurry, transitional, or uninteresting

The model was initially trained on ~20 manually labeled Instagram posts
using the tkinter labeler utility (labeler.py). More posts improve accuracy.
"""

import os
import sys
import argparse
import numpy as np
from pathlib import Path

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, Dataset
    from torchvision import transforms, models
except ImportError:
    print("Install PyTorch: pip install torch torchvision")
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print("Install Pillow: pip install Pillow")
    sys.exit(1)


class FrameDataset(Dataset):
    def __init__(self, data_dirs, transform=None):
        self.samples = []
        self.transform = transform
        for label_idx, data_dir in enumerate(data_dirs):
            data_path = Path(data_dir)
            if not data_path.exists():
                print(f"Warning: {data_dir} not found, skipping")
                continue
            for img_path in sorted(data_path.glob("*")):
                if img_path.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"):
                    self.samples.append((str(img_path), label_idx))
        print(f"Loaded {len(self.samples)} samples from {len(data_dirs)} directories")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        image = Image.open(img_path).convert("RGB")
        if self.transform:
            image = self.transform(image)
        return image, label


def get_model(num_classes=2):
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    for param in model.features[:14].parameters():
        param.requires_grad = False
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.2),
        nn.Linear(in_features, num_classes),
    )
    return model


def train(model, train_loader, val_loader, epochs, lr, device):
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=3, factor=0.5)
    best_val_acc = 0.0
    best_state = None

    for epoch in range(epochs):
        model.train()
        train_loss, train_correct, train_total = 0.0, 0, 0
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()
            _, predicted = outputs.max(1)
            train_correct += predicted.eq(labels).sum().item()
            train_total += labels.size(0)
        train_acc = 100.0 * train_correct / train_total

        model.eval()
        val_loss, val_correct, val_total = 0.0, 0, 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item()
                _, predicted = outputs.max(1)
                val_correct += predicted.eq(labels).sum().item()
                val_total += labels.size(0)
        val_acc = 100.0 * val_correct / val_total
        scheduler.step(val_loss / max(len(val_loader), 1))

        print(f"Epoch [{epoch+1}/{epochs}] Train Acc: {train_acc:.1f}% Val Acc: {val_acc:.1f}%")
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
    return best_state


def export_onnx(model, output_path, device):
    model.eval()
    dummy = torch.randn(1, 3, 224, 224).to(device)
    torch.onnx.export(model, dummy, output_path, export_params=True, opset_version=11,
                      input_names=["input"], output_names=["output"],
                      dynamic_axes={"input": {0: "batch"}, "output": {0: "batch"}})
    print(f"Model exported to {output_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", nargs="+", default=["./ideal", "./non_ideal"])
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--output", type=str, default="../backend/model.onnx")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    dataset = FrameDataset(args.data_dir, transform=transform)
    if len(dataset) == 0:
        print("No data found. Run labeler.py first.")
        sys.exit(1)

    val_size = int(len(dataset) * 0.2)
    train_size = len(dataset) - val_size
    train_ds, val_ds = torch.utils.data.random_split(dataset, [train_size, val_size])
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size)

    model = get_model().to(device)
    best = train(model, train_loader, val_loader, args.epochs, args.lr, device)
    if best:
        model.load_state_dict(best)
        os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
        export_onnx(model, args.output, device)


if __name__ == "__main__":
    main()
