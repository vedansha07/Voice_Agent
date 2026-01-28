import React, { useEffect, useState } from 'react';
import { useVoice } from './hooks/useVoice';
import { motion, AnimatePresence } from 'framer-motion';
import { StopCircle, Mic, MicOff, MessageSquare } from 'lucide-react';
import VoiceVisualizer from './components/VoiceVisualizer';
import ChatDrawer from './components/ChatDrawer';


function App() {
  const {
    transcript,
    listening,
    isProcessing,
    history,
    lastError,
    startListening,
    stopListening,
    cancelSpeech,
    browserSupportsSpeechRecognition,
    isAiSpeaking,
    isManualMode
  } = useVoice();

  // Navigation / Drawer State
  const [isChatOpen, setIsChatOpen] = useState(false);



  const toggleListening = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="flex h-screen items-center justify-center text-red-400 bg-slate-900">
        Browser does not support speech recognition.
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-slate-950 overflow-hidden flex flex-col items-center justify-center font-sans text-slate-50">

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 Pointer-events-none" />

      {/* Main Visualizer Area */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full">
        <VoiceVisualizer isActive={listening || isAiSpeaking} />

        {/* Status Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 h-8 text-center"
        >
          {isProcessing ? (
            <span className="text-blue-400 animate-pulse text-lg tracking-widest">THINKING...</span>
          ) : listening ? (
            <span className="text-blue-300/80 text-lg tracking-wide">{transcript || "Listening..."}</span>
          ) : isAiSpeaking ? (
            <span className="text-blue-500 font-medium text-lg tracking-wide">Speaking...</span>
          ) : (
            <span className="text-slate-500 text-sm tracking-widest uppercase">Tap Mic to Start</span>
          )}
        </motion.div>
      </div>

      {/* Control Bar */}
      <div className="relative z-20 w-full max-w-md mb-12 flex items-center justify-center gap-8 backdrop-blur-sm p-6 rounded-3xl bg-slate-900/30 border border-white/5 shadow-2xl">

        {/* Stop Button */}
        <button
          onClick={cancelSpeech}
          disabled={!isAiSpeaking}
          className={`p-4 rounded-xl transition-all duration-300 ${isAiSpeaking
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]'
            : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
            }`}
        >
          <StopCircle className="w-6 h-6" />
        </button>

        {/* Mic Button */}
        <button
          onClick={toggleListening}
          className={`relative p-8 rounded-full transition-all duration-500 shadow-xl ${listening
            ? 'bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.6)] scale-110'
            : isProcessing
              ? 'bg-indigo-900 text-indigo-300 animate-pulse'
              : 'bg-slate-800 text-blue-400 hover:bg-blue-600 hover:text-white hover:scale-105'
            }`}
        >
          {listening ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
        </button>

        {/* Chat Toggle */}
        <button
          onClick={() => setIsChatOpen(true)}
          className="p-4 rounded-xl bg-slate-800/50 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300 transition-all duration-300"
        >
          <MessageSquare className="w-6 h-6" />
          {/* Unread dot simulation could go here */}
        </button>
      </div>

      {/* Helper Text */}
      <div className="absolute bottom-6 left-0 right-0 text-center text-slate-500 text-sm tracking-wide z-10 pointer-events-none">
        {isManualMode ? "Direct Command Mode Active (Say anything)" : "Say 'Jarvis' to wake"}
      </div>

      {/* Error Toast */}
      <AnimatePresence>
        {lastError && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-32 bg-red-500/90 text-white px-6 py-3 rounded-full shadow-xl backdrop-blur-md font-medium text-sm"
          >
            {lastError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        history={history}
      />

    </div>
  );
}

export default App;
