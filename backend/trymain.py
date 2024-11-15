import os
from pathlib import Path

# Get the absolute path to your service account file
current_dir = os.path.dirname(os.path.abspath(__file__))
service_account_path = os.path.join(current_dir, 'service_account.json')

# Set it as environment variable
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = service_account_path

print(f"Credentials path: {os.environ['GOOGLE_APPLICATION_CREDENTIALS']}")