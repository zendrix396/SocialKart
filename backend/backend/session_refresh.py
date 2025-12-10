import os
import subprocess
from instaloader import Instaloader
from dotenv import load_dotenv

load_dotenv()
# --- ⚠️ CONFIGURATION: EDIT THESE VARIABLES ---
INSTAGRAM_USERNAME = os.getenv("INSTAGRAM_USERNAME")
INSTAGRAM_PASSWORD = os.getenv("INSTAGRAM_PASSWORD")  # Be careful storing passwords in plain text
SESSION_FILENAME = f"{INSTAGRAM_USERNAME}.session"
print(INSTAGRAM_USERNAME)
print(INSTAGRAM_PASSWORD)
# Full path to your .pem key file on your Windows machine
PEM_KEY_PATH = r"C:\Users\shikhar\Downloads\socialkart-instance.pem" 

# Your EC2 instance details
EC2_USER_HOST = "ec2-user@43.205.215.231" 

# The full path to the project directory on your EC2 server
REMOTE_PROJECT_PATH = "/home/ec2-user/backend/.sessions"
# --- END OF CONFIGURATION ---


def generate_new_session():
    """Logs into Instagram and saves a new session file locally."""
    print("-> Attempting to log into Instagram to create a new session...")
    try:
        L = Instaloader()
        L.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD)
        L.save_session_to_file(SESSION_FILENAME)
        print(f"[SUCCESS] New session file '{SESSION_FILENAME}' created locally.")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to log in and create session file: {e}")
        return False

def upload_session_to_ec2():
    """Uploads the local session file to the EC2 instance using SCP."""
    print(f"-> Uploading '{SESSION_FILENAME}' to EC2...")
    
    # Construct the SCP command
    # Note: Using f-strings with raw string for the path
    destination = f"{EC2_USER_HOST}:{REMOTE_PROJECT_PATH}"
    scp_command = [
        "scp",
        "-i", PEM_KEY_PATH,
        SESSION_FILENAME,
        destination
    ]
    
    try:
        # Run the command
        result = subprocess.run(scp_command, check=True, capture_output=True, text=True)
        print(f"[SUCCESS] Session file uploaded to {destination}.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] SCP upload failed.")
        print(f"Stderr: {e.stderr}")
        return False

def restart_service_on_ec2():
    """SSH into EC2 and restarts the systemd service."""
    print("-> Restarting the application service on EC2...")
    
    # The command to be executed remotely
    remote_command = "sudo systemctl restart socialkart"
    
    ssh_command = [
        "ssh",
        "-i", PEM_KEY_PATH,
        EC2_USER_HOST,
        remote_command
    ]
    
    try:
        result = subprocess.run(ssh_command, check=True, capture_output=True, text=True)
        print("[SUCCESS] 'socialkart' service restarted successfully on EC2.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] SSH command to restart service failed.")
        print(f"Stderr: {e.stderr}")
        return False

def main():
    print("--- Starting Instagram Session Refresh ---")
    if generate_new_session():
        if upload_session_to_ec2():
            restart_service_on_ec2()
    print("--- Refresh Process Finished ---")

if __name__ == "__main__":
    main()
