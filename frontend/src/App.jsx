import React, { useEffect, useState } from 'react';
import { useVoice } from './hooks/useVoice';
import { motion, AnimatePresence } from 'framer-motion';
import { StopCircle, Mic, MicOff, MessageSquare } from 'lucide-react';
import VoiceVisualizer from './components/VoiceVisualizer';
import ChatDrawer from './components/ChatDrawer';
import { useAuth0 } from '@auth0/auth0-react';
import { LoginButton, LogoutButton } from './components/AuthComponents';
import axios from 'axios';
import FileUpload from './components/FileUpload';

const HINTS = [
  'Try uploading a PDF and asking for a summary 📄',
  'Try saying "What is the exact time right now?" 🕒',
  'Ask questions about your uploaded documents 🤔',
  'Try saying "Search Messi on Youtube" 🔍',
  'Try saying "Clear my chat history" 🧹'
];

function FeatureHints() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % HINTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center pointer-events-none z-10 overflow-hidden h-12 mt-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="text-slate-300 text-sm tracking-wide bg-slate-800/80 px-6 py-2 rounded-full border border-slate-700/50 backdrop-blur-md shadow-lg flex items-center gap-2"
        >
          <span className="text-blue-400">✨</span> {HINTS[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

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
    isManualMode,
    sessionId
  } = useVoice();

  // Navigation / Drawer State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const { isAuthenticated, isLoading, getAccessTokenSilently, user } = useAuth0();

  const isUserAuthenticated = isAuthenticated || isGuest;

  useEffect(() => {
    if (isAuthenticated && user) {
      const syncUser = async () => {
        try {
          const token = await getAccessTokenSilently();
          await axios.post('http://localhost:3000/api/user/sync', {
            email: user.email,
            name: user.name,
            picture: user.picture
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (e) {
          console.error("Failed to sync user", e);
        }
      };
      syncUser();
    }
  }, [isAuthenticated, getAccessTokenSilently, user]);

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

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-blue-400 bg-slate-900 text-lg tracking-widest animate-pulse">LOADING AUTH...</div>;
  }

  if (!isUserAuthenticated) {
    return (
      <div className="relative h-screen w-full bg-slate-950 overflow-hidden flex flex-col items-center justify-center font-sans text-slate-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950 pointer-events-none" />
        
        <div className="z-10 flex flex-col items-center w-full max-w-sm px-4">
            
          {/* Fading Mic Orb representation for the login screen */}
          <div className="w-32 h-32 mb-12 relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-[40px] animate-pulse"></div>
            <div className="w-16 h-16 rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400/80 to-transparent blur-md"></div>
            <div className="absolute inset-0 border border-blue-500/20 rounded-full scale-[1.2]"></div>
            <div className="absolute inset-0 border border-blue-500/10 rounded-full scale-[1.4]"></div>
          </div>

          <h1 className="text-xl font-light tracking-widest text-slate-400 uppercase mb-12 text-center">
            Verification Required
          </h1>
          
          <div className="w-full flex-col flex gap-3 backdrop-blur-sm p-6 rounded-3xl bg-slate-900/30 border border-white/5 shadow-2xl">
            <LoginButton />
            
            <button 
              onClick={() => setIsGuest(true)}
              className="w-full px-6 py-4 rounded-2xl bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 font-medium transition-all duration-300 text-sm tracking-wide border border-transparent hover:border-slate-700/50"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-slate-950 overflow-hidden flex flex-col items-center justify-center font-sans text-slate-50">

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Guest Mode Warning Banner */}
      {isGuest && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-200/80 text-xs py-2 text-center flex items-center justify-center gap-2 backdrop-blur-md z-[60]">
           <span>⚠️ Guest Mode: Conversations are only saved for this session. Log in to save permanently.</span>
        </div>
      )}

      {/* Top Header */}
      <div className="absolute top-6 left-6 right-6 z-50 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto px-4 flex items-center">
          <FileUpload sessionId={sessionId} />
        </div>
        <div className="flex items-center gap-4 pointer-events-auto">
          <LogoutButton onGuestExit={() => setIsGuest(false)} />
        </div>
      </div>

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

        {/* Floating Feature Hints */}
        <FeatureHints />

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
        sessionId={sessionId}
      />

    </div>
  );
}

export default App;
