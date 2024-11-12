from moviepy.editor import VideoFileClip
import os
from google.cloud import speech
import io
from spleeter.separator import Separator
from pydub import AudioSegment
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'service_account.json'
def get_sample_rate(file_path):
    audio = AudioSegment.from_file(file_path)
    return audio.frame_rate

def convert_to_mono(input_file, output_file):
    audio = AudioSegment.from_wav(input_file)
    mono_audio = audio.set_channels(1)
    mono_audio.export(output_file, format="wav")
    
def separate_vocals(input_file, output_dir):
    try:
        separator = Separator('spleeter:2stems', multiprocess=False)
        separator.separate_to_file(input_file, output_dir, filename_format='{instrument}.wav')
        print("Separation complete! Check the output files.")
    except Exception as e:
        print(f"An error occurred during separation: {str(e)}")
        raise e
        
def transcribe_video(video_path, posts_dir, shortcode):
    try:
        video = VideoFileClip(video_path)
        audio_path = os.path.join(posts_dir, f'post_{shortcode}', 'audio.wav')
        video.audio.write_audiofile(audio_path)
        separate_vocals(audio_path, posts_dir)
        vocals_path = os.path.join(posts_dir, 'vocals.wav')
        mono_vocals_path = os.path.join(posts_dir, f'post_{shortcode}', 'vocals_mono.wav')
        convert_to_mono(vocals_path, mono_vocals_path)
        client = speech.SpeechClient()
        with io.open(mono_vocals_path, "rb") as audio_file:
            content = audio_file.read()
        audio = speech.RecognitionAudio(content=content)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=get_sample_rate(vocals_path),
            language_code="en-US",
            enable_automatic_punctuation=True,
            use_enhanced=True,
            model="video"
        )
        response = client.recognize(config=config, audio=audio)
        captions_path = os.path.join(posts_dir, f'post_{shortcode}', 'captions.txt')
        with open(captions_path, "w") as f:
            for result in response.results:
                transcript = result.alternatives[0].transcript
                f.write(f"{transcript}\n")  # Write each transcript to the file
        print("Transcription complete. Captions saved to captions.txt.")

    except Exception as e:
        print(f"An error occurred during transcription: {e}")
        raise e