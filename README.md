# AI Voice Assistant 🎙️

A fully Agentic Voice Assistant that allows "Hands-Free" interaction using the **"Jarvis"** wake word. It controls the browser, speaks naturally, and handles interruptions.

Designed for production with **zero-latency Native Speech API**.

## 🚀 Features

- 🎙️ **Hands-Free Activation**: Just say **"Jarvis"** to wake it up. No clicking required. *(Powered by Native Browser Speech API)*.
- 🔄 **Continuous Listening**: The assistant stays awake and auto-restarts if it detects silence, ensuring it's always ready.
- 🚫 **Echo Cancellation**: Automatically stops its own microphone while speaking to prevent hearing itself.
- 🎨 **Modern Dark UI**: Immersive dark theme with a pulsing concentric circle visualizer.
- 🧠 **AI Intelligence**: Powered by **Groq (Llama 3)** for ultra-fast responses.
- 🌐 **Browser Control**: Can open websites (YouTube, Google) directly.

---

## 🛠️ Architecture

- **Frontend (Vercel)**: React, Vite, TailwindCSS. Uses `window.SpeechRecognition` (Native) for zero-dependency voice input.
- **Backend (Render)**: Node.js, Express. Handles API security and connects to Groq.

---

## 📦 Setup & Installation

### Prerequisites
- Node.js (v18+)
- **Groq API Key** (Get one for free at [console.groq.com](https://console.groq.com/keys))

### 1. Backend Setup
```bash
cd backend
npm install
# Create .env file with your API Key
echo "GROQ_API_KEY='your_key_here'" > .env
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

### 1. Deploy Backend (Render/Heroku/Railway)
- Deploy the `/backend` folder.
- Add `GROQ_API_KEY` to the environment variables.
- Copy your deployed Backend URL (e.g., `https://your-backend.onrender.com`).

### 2. Deploy Frontend (Vercel/Netlify)
- Update `frontend/src/hooks/useVoice.js` with your **Backend URL**.
- Deploy the `/frontend` folder.
- **Note:** Vercel requires the `vercel.json` file (included) to handle routing rewrites.

---

## 🎮 Usage Guide

1. **Initial Setup**: Open the app. **Allow Microphone Permission** when prompted.
2. **Wake Word**: Just say **"Jarvis"**.
   - *Status*: "Direct Command Mode Active" -> You can speak naturally.
3. **Commands**:
   - *"Jarvis, open YouTube"*
   - *"Jarvis, what is the weather in Tokyo?"* (Opens Google Search)
   - *"Jarvis, reset chat"*
4. **Interruption**:
   - Say **"Stop"** or click the **Red Stop Button** interrupting the AI.

---

## ⚠️ Troubleshooting

- **Microphone stops working?** 
  - The app creates an "Intentional Stop" loop. If it stops, just refresh the page.
- **"Network Error"?** 
  - Ensure your Backend URL in `useVoice.js` is correct and the backend is running.
  - Check `vercel.json` and CORS settings if deploying.
- **"Sorry, something went wrong"?** 
  - Check your Groq API Key quota.
