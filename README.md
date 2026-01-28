# AI Voice Assistant

A fully Agentic Voice Assistant that allows "Hands-Free" interaction using the **"Jarvis"** wake word. It controls the browser, speaks naturally, and handles interruptions.

## 🚀 Features
- 🎙️ **Hands-Free Activation**: Just say **"Jarvis"** to wake it up. No clicking required.
- 🎨 **Modern Dark UI**: Immersive dark theme with a pulsing concentric circle visualizer.
- 🚦 **Control Bar**: Easy access to Stop, Mic, and Chat toggles.
- 💬 **Chat Drawer**: Slide-out panel to view conversation history.
- 🗣️ **Continuous Conversation**: Includes a **10-second Follow-Up Window**.
- 🧠 **AI Intelligence**: Powered by **Groq (Llama 3)** for ultra-fast responses.
- 🌐 **Browser Control**: Can open websites (YouTube, Google) directly.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, TailwindCSS, `framer-motion`, `lucide-react`.
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
1. **Initial Setup**: Open the frontend URL. Allow Microphone and **Popups**.
2. **Wake Word**: Say **"Jarvis"** to wake it up. The status text will change to "Say 'Jarvis' to wake" or "Direct Command Mode".
3. **Visuals**: Watch the blue rings pulse when the AI listens or speaks.
3. **Commands**:
   - *"Jarvis, how are you?"*
   - *"Open YouTube"*
   - *"Search for weather in Tokyo"*
    - *"Reset chat"*
4. **Interruption**:
    - Say **"Stop"**, **"Wait"**, or **"Cancel"** to interrupt.
    - Or press the **Red Stop Button** in the control bar.
5. **Chat History**: Click the **Message Bubble** icon to view past conversations.

## ⚠️ Troubleshooting
- **Microphone not starting?** Click the mic button once to initialize permissions.
- **"Popup Blocked"?** Check your address bar and allow popups for localhost.
- **Rate Limit?** Groq has a daily free limit. If it stops working, check your usage on Groq Console.
