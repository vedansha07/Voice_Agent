import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Microphone = ({ listening, isProcessing, onClick }) => {
    return (
        <div className="relative">
            {/* Pulse Animation Background */}
            {listening && (
                <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-blue-500 rounded-full blur-lg"
                />
            )}

            <button
                onClick={onClick}
                className={`
                    relative z-10 p-8 rounded-full transition-all duration-300 shadow-xl border-4
                    ${listening
                        ? 'bg-red-500 border-red-400 shadow-red-500/50 scale-105'
                        : isProcessing
                            ? 'bg-gray-700 border-gray-600'
                            : 'bg-indigo-600 border-indigo-400 hover:bg-indigo-500 hover:scale-105 shadow-indigo-500/50'
                    }
                `}
            >
                {isProcessing ? (
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                ) : listening ? (
                    <div className="animate-pulse">
                        <Mic className="w-12 h-12 text-white" />
                    </div>
                ) : (
                    <Mic className="w-12 h-12 text-white" />
                )}
            </button>

            <div className="mt-8 text-xl font-medium text-gray-300 tracking-wide min-h-[1.5rem]">
                {listening ? "Listening..." : isProcessing ? "Thinking..." : "Tap to Speak"}
            </div>
        </div>
    );
};

export default Microphone;
