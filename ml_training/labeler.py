"""
SocialKart Frame Labeler
=========================
Tkinter utility for manually labeling Instagram video frames
as ideal (relevant) or non-ideal (non-relevant).

Usage:
    python labeler.py

Keyboard:
    F / Right Arrow  - Keep frame (ideal)
    J / Left Arrow   - Skip frame (non-ideal)
    Q / Escape       - Quit
"""

import os
import sys
import argparse
import tkinter as tk
from tkinter import messagebox
from pathlib import Path
from PIL import Image, ImageTk
import subprocess
import glob
import shutil
import threading
import re

try:
    import imageio_ffmpeg as iio_ffmpeg
    FFMPEG_PATH = iio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    FFMPEG_PATH = "ffmpeg"


def extract_frames(video_path, output_dir, target_frames=50):
    os.makedirs(output_dir, exist_ok=True)
    try:
        result = subprocess.run([FFMPEG_PATH, "-hide_banner", "-i", video_path],
                                capture_output=True, text=True, timeout=15)
        match = re.search(r"Duration:\s+(\d+):(\d+):(\d+(?:\.\d+)?)", result.stderr or "")
        if match:
            h, m, s = int(match.group(1)), int(match.group(2)), float(match.group(3))
            duration = h * 3600 + m * 60 + s
        else:
            duration = 10.0
    except Exception:
        duration = 10.0

    fps = max(target_frames / max(duration, 0.1), 0.1)
    output_pattern = os.path.join(output_dir, "frame_%04d.png").replace("\\", "/")
    cmd = [FFMPEG_PATH, "-hide_banner", "-loglevel", "error", "-y",
           "-i", video_path, "-vf", f"fps={fps:.6f}", output_pattern]
    subprocess.run(cmd, capture_output=True, timeout=120)
    return sorted(glob.glob(os.path.join(output_dir, "*.png")))


class FrameLabeler:
    def __init__(self, ideal_dir, non_ideal_dir):
        self.ideal_dir = Path(ideal_dir)
        self.non_ideal_dir = Path(non_ideal_dir)
        self.ideal_dir.mkdir(parents=True, exist_ok=True)
        self.non_ideal_dir.mkdir(parents=True, exist_ok=True)
        self.frames = []
        self.current_idx = 0
        self.counts = {"ideal": len(list(self.ideal_dir.glob("*.png"))),
                       "non_ideal": len(list(self.non_ideal_dir.glob("*.png")))}

        self.root = tk.Tk()
        self.root.title("SocialKart Frame Labeler")
        self.root.geometry("900x750")
        self.root.configure(bg="#1a1a1a")
        self.root.bind("<Key>", self._on_key)
        self._build_ui()
        self.root.mainloop()

    def _build_ui(self):
        top = tk.Frame(self.root, bg="#1a1a1a")
        top.pack(fill=tk.X, padx=10, pady=5)
        tk.Label(top, text="URL:", fg="#888", bg="#1a1a1a", font=("Consolas", 10)).pack(side=tk.LEFT)
        self.url_entry = tk.Entry(top, width=60, bg="#222", fg="#0f0", insertbackground="#0f0",
                                  font=("Consolas", 10), relief=tk.FLAT)
        self.url_entry.pack(side=tk.LEFT, padx=5, ipady=3)
        self.url_entry.insert(0, "https://instagram.com/p/")
        self.fetch_btn = tk.Button(top, text="Fetch & Extract", bg="#0a5c2e", fg="white",
                                   font=("Consolas", 10, "bold"), relief=tk.FLAT, command=self._fetch)
        self.fetch_btn.pack(side=tk.LEFT, padx=5)
        self.stats_label = tk.Label(top, text=f"Ideal: {self.counts['ideal']} | Non-Ideal: {self.counts['non_ideal']}",
                                    fg="#0f0", bg="#1a1a1a", font=("Consolas", 10))
        self.stats_label.pack(side=tk.RIGHT)

        self.canvas = tk.Canvas(self.root, bg="#111", highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

        info = tk.Frame(self.root, bg="#1a1a1a")
        info.pack(fill=tk.X, padx=10, pady=5)
        self.frame_label = tk.Label(info, text="No frames loaded", fg="#888", bg="#1a1a1a", font=("Consolas", 10))
        self.frame_label.pack(side=tk.LEFT)
        self.progress_label = tk.Label(info, text="", fg="#666", bg="#1a1a1a", font=("Consolas", 10))
        self.progress_label.pack(side=tk.RIGHT)

        instr = tk.Frame(self.root, bg="#222")
        instr.pack(fill=tk.X, padx=10, pady=(0, 10))
        tk.Label(instr, fg="#888", bg="#222", font=("Consolas", 9),
                 text="[F/Right] = Ideal    [J/Left] = Non-Ideal    [Q/Esc] = Quit").pack(pady=5)

    def _fetch(self):
        url = self.url_entry.get().strip()
        if not url or "instagram.com" not in url:
            messagebox.showerror("Error", "Enter a valid Instagram URL")
            return
        self.fetch_btn.config(state=tk.DISABLED, text="Extracting...")
        self.root.update()
        threading.Thread(target=self._do_fetch, args=(url,), daemon=True).start()

    def _do_fetch(self, url):
        try:
            import requests, json
            match = re.search(r"instagram\.com/(?:[\w.]+/)?p/([A-Za-z0-9_-]+)", url)
            if not match:
                self.root.after(0, lambda: messagebox.showerror("Error", "Invalid URL"))
                return
            shortcode = match.group(1)
            temp_dir = Path(f"_temp_{shortcode}")
            temp_dir.mkdir(exist_ok=True)

            headers = {"User-Agent": "Mozilla/5.0", "Content-Type": "application/json",
                       "Origin": "https://downreels.com", "Referer": "https://downreels.com/"}
            resp = requests.post("https://api.zoraahub.com/fetch.php", json={"url": url}, headers=headers, timeout=30)
            data = resp.json()

            video_url = None
            def find_video(obj):
                nonlocal video_url
                if video_url: return
                if isinstance(obj, dict):
                    for v in obj.values():
                        if isinstance(v, str) and ("zoraahub.com" in v or "cdninstagram.com" in v) and ".mp4" in v:
                            video_url = v; return
                        elif isinstance(v, (dict, list)): find_video(v)
                elif isinstance(obj, list):
                    for item in obj: find_video(item)
            find_video(data)

            if not video_url:
                self.root.after(0, lambda: messagebox.showerror("Error", "No video found"))
                return

            dl_h = {k: v for k, v in headers.items() if k != "Content-Type"}
            vpath = temp_dir / "video.mp4"
            r = requests.get(video_url, headers=dl_h, stream=True, timeout=60)
            with open(vpath, "wb") as f:
                for chunk in r.iter_content(8192): f.write(chunk)

            frames = extract_frames(str(vpath), str(temp_dir / "frames"))
            self.root.after(0, lambda: self._load(frames, temp_dir))
        except Exception as e:
            self.root.after(0, lambda: messagebox.showerror("Error", str(e)))
            self.root.after(0, lambda: self.fetch_btn.config(state=tk.NORMAL, text="Fetch & Extract"))

    def _load(self, frames, temp_dir):
        self.frames = frames
        self.current_idx = 0
        self._temp_dir = temp_dir
        self.fetch_btn.config(state=tk.NORMAL, text="Fetch & Extract")
        if self.frames: self._show()
        else: messagebox.showinfo("Info", "No frames extracted")

    def _show(self):
        if self.current_idx >= len(self.frames):
            self.canvas.delete("all")
            self.frame_label.config(text="All frames labeled!")
            return
        path = self.frames[self.current_idx]
        self.progress_label.config(text=f"{self.current_idx+1}/{len(self.frames)}")
        self.frame_label.config(text=f"{Path(path).name}  (F=keep, J=skip)")
        try:
            img = Image.open(path)
            self.root.update_idletasks()
            cw, ch = max(self.canvas.winfo_width(), 600), max(self.canvas.winfo_height(), 500)
            ratio = min(cw / img.width, ch / img.height)
            img = img.resize((int(img.width*ratio), int(img.height*ratio)), Image.LANCZOS)
            self._photo = ImageTk.PhotoImage(img)
            self.canvas.delete("all")
            self.canvas.create_image(cw//2, ch//2, image=self._photo, anchor=tk.CENTER)
        except Exception as e:
            self.canvas.delete("all")
            self.canvas.create_text(400, 300, text=str(e), fill="#f00", font=("Consolas", 12))

    def _label(self, label):
        if self.current_idx >= len(self.frames): return
        src = self.frames[self.current_idx]
        dest_dir = self.ideal_dir if label == "ideal" else self.non_ideal_dir
        dest = dest_dir / Path(src).name
        c = 1
        while dest.exists():
            dest = dest_dir / f"{Path(src).stem}_{c}.png"
            c += 1
        shutil.copy2(src, dest)
        self.counts[label] += 1
        self.stats_label.config(text=f"Ideal: {self.counts['ideal']} | Non-Ideal: {self.counts['non_ideal']}")
        self.current_idx += 1
        self._show()

    def _on_key(self, event):
        k = event.keysym.lower()
        if k in ("f", "right"): self._label("ideal")
        elif k in ("j", "left"): self._label("non_ideal")
        elif k in ("q", "escape"):
            if hasattr(self, "_temp_dir"): shutil.rmtree(self._temp_dir, ignore_errors=True)
            self.root.destroy()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ideal_dir", default="./ideal")
    parser.add_argument("--non_ideal_dir", default="./non_ideal")
    args = parser.parse_args()
    FrameLabeler(args.ideal_dir, args.non_ideal_dir)


if __name__ == "__main__":
    main()
