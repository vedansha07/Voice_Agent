# AI Voice Assistant 2.0 (Hands-Free edition)

A fully Agentic Voice Assistant that allows "Hands-Free" interaction using the **"Jarvis"** wake word. It controls the browser, speaks naturally, and handles interruptions.

## 🚀 Features
- 🎙️ **Hands-Free Activation**: Just say **"Jarvis"** to wake it up. No clicking required.
- 🗣️ **Continuous Conversation**: Includes a **10-second Follow-Up Window** where you can reply naturally without the wake word.
- 🚦 **Smart Barge-In**: You can interrupt the AI at any time by saying "Stop", "Wait", etc.
- 🧠 **AI Intelligence**: Powered by **Groq (Llama 3)** for ultra-fast, near-instant responses.
- 🌐 **Browser Control**: Can open websites (YouTube, Google, Weather) directly.
- 🔊 **Visual Feedback**: Real-time transcriptions that filter out the AI's own voice.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, TailwindCSS, `react-speech-recognition`, `axios`.
- **Backend**: Node.js, Express, `groq-sdk` (Llama 3.3 70B).

## 📦 Setup & Installation

### Prerequisites
- Node.js (v18+)
- **Groq API Key** (Get one for free at [console.groq.com](https://console.groq.com/keys))

### 1. Backend Setup
```bash
cd backend
npm install
# Create .env file
echo "GROQ_API_KEY='your_key_here'" > .env
npm run dev
```
The server will start on `http://localhost:3000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`.

## 🎮 Usage Guide
1. **Initial Setup**: Open the frontend URL. Allow Microphone and **Popups** (crucial for opening tabs).
2. **Wake Word**: Say **"Jarvis"**. The status text will change to "Direct Command Mode".
3. **Commands**:
   - *"Jarvis, how are you?"*
   - *"Open YouTube"*
   - *"Search for weather in Tokyo"*
   - *"Reset chat"*
4. **Follow-Up**: After the AI answers, you have 10 seconds to say another command *without* saying Jarvis.

## ⚠️ Troubleshooting
- **Microphone not starting?** Click the mic button once to initialize permissions.
- **"Popup Blocked"?** Check your address bar and allow popups for localhost.
- **Rate Limit?** Groq has a daily free limit. If it stops working, check your usage on Groq Console.
