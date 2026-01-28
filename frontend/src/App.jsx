import React, { useEffect } from 'react';
import Microphone from './components/Microphone';
import { useVoice } from './hooks/useVoice';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const {
    transcript,
    listening,
    isProcessing,
    history,
    lastError,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition,
    isAiSpeaking,
    isManualMode
  } = useVoice();

  // Scroll to bottom of chat
  const messagesEndRef = React.useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [history, transcript]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="flex h-screen items-center justify-center text-red-400">
        Browser does not support speech recognition.
      </div>
    );
  }

  const handleMicClick = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center py-10 px-4 font-sans text-slate-50 overscroll-none">

      {/* Header */}
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-8 tracking-tighter drop-shadow-lg">
        AI Voice Assistant
      </h1>

      {/* Main Content Area */}
      <div className="w-full max-w-2xl flex-1 flex flex-col gap-8">

        {lastError && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-2 rounded-lg mb-4 text-sm text-center">
            {lastError}
          </div>
        )}

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto max-h-[60vh] space-y-4 p-4 rounded-2xl bg-slate-800/50 shadow-inner border border-white/5 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {history.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-500 italic">
              Start a conversation...
            </div>
          )}

          <AnimatePresence initial={false}>
            {history.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                            max-w-[80%] rounded-2xl px-5 py-3 text-lg leading-relaxed shadow-md
                            ${msg.type === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-700 text-gray-100 rounded-tl-none border border-slate-600'}
                        `}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Live Transcript (during speaking) */}
        <div className="h-16 flex items-center justify-center px-4">
          {listening && transcript && !isAiSpeaking && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-light text-cyan-300 text-center animate-pulse"
            >
              "{transcript}"
            </motion.p>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center pb-10">
          <Microphone
            listening={listening}
            isProcessing={isProcessing}
            onClick={handleMicClick}
          />
        </div>

        {/* Helper Text */}
        <div className="text-center text-slate-400 text-sm h-6">
          {isManualMode ? "Direct Command Mode Active (Say anything)" : "Say 'Jarvis' to wake"}
        </div>

      </div>
    </div>
  );
}

export default App;
