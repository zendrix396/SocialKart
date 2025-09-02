# SocialKart

> Transform Social Media Content into E-commerce Product Listings with AI.

SocialKart is an AI-powered tool that automatically converts Instagram posts into professional product listings. It streamlines the e-commerce content creation process by extracting video frames, transcribing audio, and using AI to generate marketing copy.

## Tech Stack

-   **Frontend**: React, Tailwind CSS, Framer Motion
-   **Backend**: Python, Flask, Socket.IO
-   **AI/ML**: Google Gemini, ONNX (for image classification), Instaloader

## Setup and Running the Project

### Prerequisites

-   Node.js and npm
-   Python 3.9+ and pip
-   An Instagram account
-   A Google Gemini API Key

### 1. Clone the repository

```bash
git clone https://github.com/YusiferZendric/SocialKart.git
cd SocialKart
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory and add your credentials:

```env
# .env
INSTAGRAM_USERNAME="your_instagram_username"
INSTAGRAM_PASSWORD="your_instagram_password"
GEMINI_API_KEY="your_gemini_api_key"
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Run the Application

1.  **Start the Backend**:
    ```bash
    # In the /backend directory
    python app.py
    ```
2.  **Start the Frontend**:
    ```bash
    # In the /frontend directory
    npm start
    ```

The application will be available at `http://127.0.0.1:3000`.

---
