# AI Voice Assistant

A fully Agentic Voice Assistant that allows Hands-Free interaction using the "Jarvis" wake word. It controls the browser, speaks naturally, and handles interruptions.

Designed for production with ultra-low latency Deepgram Aura TTS, Groq (Llama 3) engines, and a secure full-stack architecture backed by Auth0 and MongoDB.

## Features

- **Hands-Free Activation**: Just say **"Jarvis"** to wake it up. No clicking required. *(Powered by Native Browser Speech API)*.
- **Deepgram Aura TTS**: Hyper-realistic, zero-latency streaming audio text-to-speech using Deepgram's Asteria voice model.
- **Secure Authentication**: Integrated with Auth0 for enterprise-grade login flows, including persistent user sessions and secure JWT verification on the backend.
- **Long-Term Memory**: All authenticated conversations are faithfully persisted to a MongoDB database, allowing the AI to remember context permanently across browser restarts.
- **Dynamic Guest Mode**: Users can bypass login to interact as a guest. The AI is dynamically injected with 'Guest Context' awareness, understanding their history is only temporary for the active session.
- **Feature Discovery Hints**: A sleek, animated suggestions banner continuously floats above the controls to intuitively guide users on the Agent's advanced capabilities.
- **Real-Time Date Awareness**: The AI is injected with the exact live date and time on every interaction natively.
- **Continuous Listening**: The assistant stays awake and auto-restarts if it detects silence, ensuring it is always ready.
- **Echo Cancellation**: Automatically stops its own microphone while speaking to prevent hearing itself.
- **Modern Dark UI**: Immersive dark slate theme with a pulsing concentric circle visualizer and glassmorphism components.
- **AI Intelligence**: Powered by **Groq (Llama 3)** for ultra-fast responses.
- **Browser Control**: Can open websites (YouTube, Google) directly.

---

## Architecture

- **Frontend (Vercel/Vite)**: React, Vite, TailwindCSS. Uses Auth0 React Provider for authentication. Utilizes `window.SpeechRecognition` for input and heavily optimized `Audio` buffers to instantly stream MP3 TTS blobs.
- **Backend (Node/Express)**: Node.js, Express. Protected by `express-oauth2-jwt-bearer` middleware. Connects to the Groq API for LLM orchestration and pipelines raw binary audio streams from Deepgram directly to the frontend.
- **Database**: MongoDB via Mongoose for persisting user profiles and conversation history.

---

## Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB URI (Get a free cluster at MongoDB Atlas)
- Auth0 Tenant (Domain and Client ID)
- Groq API Key (Get one for free at console.groq.com)
- Deepgram API Key (Get one for free at console.deepgram.com)

### 1. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the backend folder and populate it:
```env
PORT=3000
GROQ_API_KEY=your_groq_key_here
DEEPGRAM_API_KEY=your_deepgram_key_here
MONGO_URI=mongodb+srv://your_connection_string
AUTH0_DOMAIN=your_auth0_domain.auth0.com
AUTH0_AUDIENCE=your_auth0_audience_identifier
```

Start the backend server:
```bash
npm run dev
# Server starts on http://localhost:3000
```

### 2. Frontend Setup
Navigate to the frontend directory and install dependencies:
```bash
cd frontend
npm install
```

Create a `.env` file in the frontend folder with your Auth0 details:
```env
VITE_AUTH0_DOMAIN=your_auth0_domain.auth0.com
VITE_AUTH0_CLIENT_ID=your_auth0_client_id
VITE_AUTH0_AUDIENCE=your_auth0_audience_identifier
```

Run the development server:
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

---

## Deployment

### 1. Deploy Backend
- Deploy the `/backend` folder.
- Ensure all environment variables (GROQ, DEEPGRAM, MONGO_URI, AUTH0) are securely added to your hosting platform.
- Copy your deployed Backend URL.

### 2. Deploy Frontend (Vercel/Netlify)
- Update `frontend/src/hooks/useVoice.js` with your deployed Backend URL.
- Deploy the `/frontend` folder.
- Ensure your Auth0 Application Settings (Allowed Callback URLs, Logout URLs, Web Origins) reflect your new hosted domain.
- Note: Vercel requires the `vercel.json` file (included) to handle routing rewrites.

---

## Usage Guide

1. Initial Setup: Open the app. Allow Microphone Permission when prompted. Log in or select "Continue as Guest".
2. Wake Word: Just say "Jarvis". Click the microphone button once to unlock the browser Audio context.
   - Status: "Direct Command Mode Active" -> You can speak naturally.
3. Commands:
   - "Jarvis, open YouTube"
   - "Jarvis, what is the exact date today?"
   - "Jarvis, reset chat"
4. Interruption:
   - Say "Stop" or click the Red Stop Button to interrupt the AI.

---

## Troubleshooting

- Audio does not play the first time?
  - Modern browsers block Auto-Play. Click the microphone button before speaking to formally unlock the Audio Context.
- Microphone stops working? 
  - The app creates an Intentional Stop loop. If it stops, just refresh the page.
- Login Fails on Hosted Vercel / "Callback URL mismatch"?
  - You must whitelist your deployed URL in the Auth0 Dashboard under "Allowed Callback URLs".
- Network Error / 500 API Error / 401 Unauthorized? 
  - Ensure your Backend URL in `useVoice.js` is correct.
  - Double check that your API keys are valid and Auth0 is properly configured.
