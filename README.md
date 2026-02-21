# AI Voice Assistant 🎙️

A fully Agentic Voice Assistant that allows "Hands-Free" interaction using the **"Jarvis"** wake word. It controls the browser, speaks naturally, and handles interruptions.

Designed for production with ultra-low latency **Deepgram Aura TTS** and **Groq (Llama 3)** engines.

## 🚀 Features

- 🎙️ **Hands-Free Activation**: Just say **"Jarvis"** to wake it up. No clicking required. *(Powered by Native Browser Speech API)*.
- 🔊 **Deepgram Aura TTS**: Hyper-realistic, zero-latency streaming audio text-to-speech using Deepgram's Asteria voice model.
- 🕒 **Real-Time Date Awareness**: The AI is injected with the exact live date and time on every interaction natively.
- 🔄 **Continuous Listening**: The assistant stays awake and auto-restarts if it detects silence, ensuring it's always ready.
- 🚫 **Echo Cancellation**: Automatically stops its own microphone while speaking to prevent hearing itself.
- 🎨 **Modern Dark UI**: Immersive dark theme with a pulsing concentric circle visualizer.
- 🧠 **AI Intelligence**: Powered by **Groq (Llama 3)** for ultra-fast responses.
- 🌐 **Browser Control**: Can open websites (YouTube, Google) directly.

---

## 🛠️ Architecture

- **Frontend (Vercel/Vite)**: React, Vite, TailwindCSS. Uses `window.SpeechRecognition` for input and heavily optimized `Audio` buffers to instantly stream MP3 TTS blobs.
- **Backend (Render/Node)**: Node.js, Express. Connects to the Groq API for LLM orchestration and pipelines raw binary audio streams from Deepgram directly to the frontend.

---

## 📦 Setup & Installation

### Prerequisites
- Node.js (v18+)
- **Groq API Key** (Get one for free at [console.groq.com](https://console.groq.com/keys))
- **Deepgram API Key** (Get one for free at [console.deepgram.com](https://console.deepgram.com/))

### 1. Backend Setup
```bash
cd backend
npm install
# Create .env file with your API Keys
echo "GROQ_API_KEY='your_groq_key_here'" > .env
echo "DEEPGRAM_API_KEY='your_deepgram_key_here'" >> .env
npm run dev
# Server starts on http://localhost:3000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🌍 Deployment

### 1. Deploy Backend
- Deploy the `/backend` folder.
- Add `GROQ_API_KEY` and `DEEPGRAM_API_KEY` to the environment variables.
- Copy your deployed Backend URL.

### 2. Deploy Frontend (Vercel/Netlify)
- Update `frontend/src/hooks/useVoice.js` with your **Backend URL**.
- Deploy the `/frontend` folder.
- **Note:** Vercel requires the `vercel.json` file (included) to handle routing rewrites.

---

## 🎮 Usage Guide

1. **Initial Setup**: Open the app. **Allow Microphone Permission** when prompted.
2. **Wake Word**: Just say **"Jarvis"**. Click the microphone button once to unlock the browser Audio context.
   - *Status*: "Direct Command Mode Active" -> You can speak naturally.
3. **Commands**:
   - *"Jarvis, open YouTube"*
   - *"Jarvis, what is the exact date today?"*
   - *"Jarvis, reset chat"*
4. **Interruption**:
   - Say **"Stop"** or click the **Red Stop Button** interrupting the AI.

---

## ⚠️ Troubleshooting

- **Audio doesn't play the first time?**
  - Modern browsers block Auto-Play. Click the microphone button *before* speaking to formally unlock the Audio Context!
- **Microphone stops working?** 
  - The app creates an "Intentional Stop" loop. If it stops, just refresh the page.
- **"Network Error" / 500 API Error?** 
  - Ensure your Backend URL in `useVoice.js` is correct.
  - Double check that both `GROQ` and `DEEPGRAM` API keys are valid and not out of credits.
