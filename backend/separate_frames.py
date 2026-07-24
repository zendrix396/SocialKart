import os
import re
import subprocess
from typing import Optional

import imageio_ffmpeg as iio_ffmpeg


def _get_video_duration_seconds(video_path: str) -> Optional[float]:
    """Return duration in seconds by parsing ffmpeg probe output. None if unknown."""
    ffmpeg_exe = iio_ffmpeg.get_ffmpeg_exe()
    try:
        proc = subprocess.run(
            [ffmpeg_exe, "-hide_banner", "-i", video_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=15,
        )
        meta = proc.stderr or ""
        match = re.search(r"Duration:\s+(\d+):(\d+):(\d+(?:\.\d+)?)", meta)
        if not match:
            return None
        hours = int(match.group(1))
        minutes = int(match.group(2))
        seconds = float(match.group(3))
        return hours * 3600 + minutes * 60 + seconds
    except subprocess.TimeoutExpired:
        print("ffmpeg probe timed out")
        return None
    except Exception as e:
        print(f"ffmpeg probe error: {e}")
        return None


def video_to_frames(video_path, frames_dir, shortcode):
    output_folder = os.path.join(frames_dir, f'output_frames_{shortcode}')
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    if not os.path.exists(video_path):
        return

    # Aim to save enough frames to allow selecting 30 relevant ones across the video
    # Save roughly up to 300 frames, spaced evenly; fallback to 1 fps for short/unknown videos
    target_saved_frames = 300

    duration_sec = _get_video_duration_seconds(video_path)
    if duration_sec and duration_sec > 0:
        fps = max(target_saved_frames / duration_sec, 0.1)  # avoid zero
    else:
        fps = 1.0

    # Build ffmpeg command to extract frames using fps filter
    ffmpeg_exe = iio_ffmpeg.get_ffmpeg_exe()

    # Ensure ffmpeg-friendly path separators for the output pattern
    output_pattern = os.path.join(output_folder, 'frame_%04d.png').replace('\\', '/')

    cmd = [
        ffmpeg_exe,
        "-nostdin",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        video_path,
        "-vf",
        f"fps={fps:.6f}",
        output_pattern,
    ]

    print(f"Running ffmpeg: fps={fps:.4f}, output={output_folder}")
    try:
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
        if result.returncode != 0:
            print(f"ffmpeg stderr: {result.stderr.decode('utf-8', errors='replace')[:500]}")
        else:
            frame_count = len([f for f in os.listdir(output_folder) if f.endswith('.png')])
            print(f"Extracted {frame_count} frames")
    except subprocess.TimeoutExpired:
        print("ffmpeg frame extraction timed out after 120s")
    except Exception as e:
        print(f"ffmpeg error: {e}")