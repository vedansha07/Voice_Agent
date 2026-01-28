import React from 'react';
import { motion } from 'framer-motion';

const VoiceVisualizer = ({ isActive }) => {
    return (
        <div className="relative flex items-center justify-center w-64 h-64">
            {/* Core Circle */}
            <div className={`w-16 h-16 rounded-full bg-blue-500 blur-md z-10 transition-all duration-300 ${isActive ? 'scale-110 shadow-[0_0_30px_rgba(59,130,246,0.8)]' : 'scale-100 opacity-50'}`} />

            {/* Inner Ring */}
            <motion.div
                animate={isActive ? { scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] } : { scale: 1, opacity: 0.1 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-32 h-32 rounded-full border-4 border-blue-500/50"
            />

            {/* Middle Ring */}
            <motion.div
                animate={isActive ? { scale: [1, 1.3, 1], opacity: [0.2, 0.6, 0.2] } : { scale: 1, opacity: 0.1 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                className="absolute w-48 h-48 rounded-full border-4 border-blue-600/30"
            />

            {/* Outer Ring */}
            <motion.div
                animate={isActive ? { scale: [1, 1.4, 1], opacity: [0.1, 0.4, 0.1] } : { scale: 1, opacity: 0.05 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                className="absolute w-64 h-64 rounded-full border-4 border-blue-700/20"
            />
        </div>
    );
};

export default VoiceVisualizer;
