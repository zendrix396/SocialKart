import os
import sys
import shlex
import subprocess
import tempfile
import base64
import traceback
from dotenv import load_dotenv
import imageio_ffmpeg as iio_ffmpeg
from google import genai
from google.genai import types

# Ensure .env is loaded
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


def extract_audio_ffmpeg(input_video_path, output_audio_path):
    """
    Extracts audio from a video using ffmpeg (no MoviePy).
    Produces a small mono MP3 suitable for transcription to reduce memory/CPU.
    """
    ffmpeg_exe = iio_ffmpeg.get_ffmpeg_exe()

    cmd = (
        f'"{ffmpeg_exe}" -nostdin -hide_banner -y '
        f'-i "{input_video_path}" '
        f'-vn -ac 1 -ar 16000 -acodec libmp3lame -b:a 96k '
        f'-threads 1 -loglevel error "{output_audio_path}"'
    )

    proc = subprocess.run(
        shlex.split(cmd),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if proc.returncode != 0:
        stderr = proc.stderr.decode(errors="ignore")
        raise RuntimeError(f"ffmpeg failed to extract audio: {stderr.strip()}")


def transcribe_audio_genai(audio_file_path):
    """Transcribes an audio file using the Gemini API (streaming)."""
    print("Transcribing audio with Gemini 2.0 Flash...")
    transcription = ""

    try:
        if not GEMINI_API_KEY:
            print("Error: GEMINI_API_KEY missing in environment.")
            return ""

        client = genai.Client(api_key=GEMINI_API_KEY)
        model = "gemini-2.0-flash"

        try:
            with open(audio_file_path, "rb") as audio_file:
                audio_data = audio_file.read()
        except FileNotFoundError:
            print(f"Error: Audio file not found at {audio_file_path}")
            return ""
        except Exception as e:
            print(f"Error reading audio file: {e}")
            return ""

        audio_base64 = base64.b64encode(audio_data).decode("utf-8")

        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_bytes(
                        mime_type="audio/mp3",
                        data=audio_base64,
                    ),
                    types.Part.from_text(
                        text="transcribe the voice in the audio file, just return the voice, don't return anything else"
                    ),
                ],
            ),
        ]

        generate_content_config = types.GenerateContentConfig()

        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            if hasattr(chunk, "text") and chunk.text:
                print(chunk.text, end="")
                transcription += chunk.text

    except Exception as e:
        print(f"An error occurred during Gemini API call: {e}")
        return ""

    return transcription


def transcribe_video(video_path, post_dir):
    """
    Extracts audio from a video using ffmpeg, transcribes it, and saves the transcript.
    """
    print("Starting audio extraction from video...")
    temp_audio_path = None

    try:
        if not os.path.exists(video_path):
            print(f"Error: Video file not found at {video_path}")
            return

        os.makedirs(post_dir, exist_ok=True)

        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_audio_file:
            temp_audio_path = temp_audio_file.name

        extract_audio_ffmpeg(video_path, temp_audio_path)

        transcript = transcribe_audio_genai(temp_audio_path)

        if transcript:
            print("\n--- VIDEO TRANSCRIPT ---")
            print(transcript)
            print("--- END TRANSCRIPT ---\n")
            transcript_path = os.path.join(post_dir, "transcript.txt")
            with open(transcript_path, "w", encoding="utf-8") as f:
                f.write(transcript)
            print(f"Transcript saved to {transcript_path}")
        else:
            print("\nDEBUG: No text could be extracted from the audio.\n")

    except Exception as e:
        print(f"An error occurred during audio processing: {e}")
        traceback.print_exc()
    finally:
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except Exception:
                pass


if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python transcribe_video.py <video_dir> <video_filename> <request_id> <temp_dir>")
        sys.exit(1)

    video_dir_arg = sys.argv[1]
    video_filename_arg = sys.argv[2]
    request_id_arg = sys.argv[3]
    temp_dir_arg = sys.argv[4]

    video_path = os.path.join(video_dir_arg, video_filename_arg)
    post_dir = os.path.join(temp_dir_arg, "post_" + request_id_arg)

    transcribe_video(video_path, post_dir)
