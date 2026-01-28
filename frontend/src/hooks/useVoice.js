// import { useState, useEffect, useCallback } from 'react';
// import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
// import axios from 'axios';

// // Backend URL - ensure this matches your backend port
// const BACKEND_URL = 'https://voice-agent-j3at.onrender.com/api/voice';

// export const useVoice = () => {
//     const [response, setResponse] = useState(null);
//     const [isProcessing, setIsProcessing] = useState(false);
//     const [history, setHistory] = useState([]);
//     const [lastError, setLastError] = useState(null);
//     const [sessionId] = useState(() => localStorage.getItem('sessionId') || `sess_${Date.now()}`);

//     useEffect(() => {
//         localStorage.setItem('sessionId', sessionId);
//     }, [sessionId]);

//     const {
//         transcript,
//         listening,
//         resetTranscript,
//         browserSupportsSpeechRecognition
//     } = useSpeechRecognition();

//     const [isAiSpeaking, setIsAiSpeaking] = useState(false);

//     const speak = useCallback((text) => {
//         if (!text) return;

//         // Mark AI as speaking but KEEP LISTENING (for barge-in)
//         setIsAiSpeaking(true);

//         const utterance = new SpeechSynthesisUtterance(text);
//         const voices = window.speechSynthesis.getVoices();
//         const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('en-US')) || voices[0];
//         if (preferredVoice) utterance.voice = preferredVoice;

//         utterance.onend = () => {
//             console.log("Speech finished. onend fired.");
//             setIsAiSpeaking(false);
//             resetTranscript();
//             // Enable Follow-Up Mode
//             console.log("Enabling Follow-Up Mode.");
//             setIsManualMode(true);

//             if (window.followUpTimer) clearTimeout(window.followUpTimer);
//             window.followUpTimer = setTimeout(() => {
//                 console.log("Follow-Up expired.");
//                 setIsManualMode(false);
//             }, 10000);
//         };

//         utterance.onerror = (e) => {
//             console.error("Speech Error:", e);
//             setIsAiSpeaking(false);
//             resetTranscript();
//         };

//         window.speechSynthesis.speak(utterance);
//     }, [resetTranscript]);

//     // Safety Loop: Sync state with actual browser speech status
//     useEffect(() => {
//         const interval = setInterval(() => {
//             if (isAiSpeaking && !window.speechSynthesis.speaking) {
//                 console.warn("State mismatch detected: isAiSpeaking=true but browser not speaking. Forcing reset.");
//                 setIsAiSpeaking(false);
//                 setIsManualMode(true); // Assume speech ended, give user control
//             }
//         }, 500);
//         return () => clearInterval(interval);
//     }, [isAiSpeaking]);

//     const [isManualMode, setIsManualMode] = useState(false);

//     // Main Control Loop
//     useEffect(() => {
//         if (listening && transcript) {

//             // 1. BARGE-IN CHECK (High Priority)
//             if (isAiSpeaking) {
//                 const lower = transcript.toLowerCase();
//                 // Expanded interruption words
//                 const stopWords = ["stop", "wait", "cancel", "hey", "jarvis", "jervis", "no", "wrong", "change", "play", "listen", "start", "open"];

//                 if (stopWords.some(word => lower.includes(word))) {
//                     console.log("Barge-in detected! Stopping AI speech.");
//                     cancelSpeech();
//                 } else {
//                     // CAUTION: While AI speaks, the mic hears the AI.
//                     // We ignore this "echo" until a keyword is heard.
//                     // To prevent buffer overflow, we can reset if too long
//                     if (transcript.length > 200) resetTranscript();
//                 }
//                 return; // Do NOT process normal commands while speaking
//             }

//             // 2. NORMAL PROCESSING (Debounced)
//             if (isProcessing) return; // Busy

//             const timer = setTimeout(() => {
//                 if (transcript.trim().length > 0) {
//                     const lowerTranscript = transcript.toLowerCase();

//                     if (isManualMode) {
//                         // Manual Mode: One-shot immediate execution
//                         console.log("Manual input processed:", transcript);
//                         processInput(true);
//                         // We consume the manual mode turn. 
//                         // The 'onend' of the response will re-enable it for the follow-up.
//                         setIsManualMode(false);
//                     } else {
//                         // Wake Word Mode
//                         if (lowerTranscript.includes("jarvis") || lowerTranscript.includes("jervis")) {
//                             const parts = lowerTranscript.split(/jarvis|jervis/);
//                             const command = parts[parts.length - 1].trim();

//                             if (command.length > 2) {
//                                 console.log("Wake word detected:", command);
//                                 processInput(true, command);
//                             } else {
//                                 // Standalone "Jarvis" detected
//                                 console.log("Standalone Wake Word detected.");
//                                 resetTranscript();

//                                 // Acknowledge and Enter Manual Mode
//                                 // We use window.speechSynthesis directly to avoid the full processInput loop
//                                 const utterance = new SpeechSynthesisUtterance("Yes?");
//                                 const voices = window.speechSynthesis.getVoices();
//                                 const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('en-US')) || voices[0];
//                                 if (preferredVoice) utterance.voice = preferredVoice;

//                                 utterance.onend = () => {
//                                     // Enter Manual Mode AFTER saying "Yes?"
//                                     console.log("Jarvis Standalone Ack finished. Manual Mode ON.");
//                                     setIsManualMode(true);
//                                 };

//                                 window.speechSynthesis.speak(utterance);
//                             }
//                         } else {
//                             // Ignore noise
//                             if (transcript.length > 100) resetTranscript();
//                         }
//                     }
//                 }
//             }, 2000); // 2s debounce to allow thinking time

//             return () => clearTimeout(timer);
//         }
//     }, [transcript, listening, isManualMode, isAiSpeaking, isProcessing, resetTranscript]);

//     const processInput = async (inputOver = false, cleanText = null) => {
//         const textToProcess = cleanText || transcript;
//         if (!textToProcess) return;

//         // Note: We do NOT stop listening here. We stay "ears open".
//         setIsProcessing(true);
//         resetTranscript(); // Clear user's command

//         try {
//             setHistory(prev => [...prev, { type: 'user', text: textToProcess }]);
//             console.log("Sending request to backend:", textToProcess);

//             const res = await axios.post(BACKEND_URL, {
//                 text: textToProcess,
//                 sessionId
//             });

//             const data = res.data;
//             console.log("Received Data:", data);
//             console.log("Action:", data.action);
//             console.log("Payload:", data.payload);
//             console.log("Content:", data.content);

//             setHistory(prev => [...prev, { type: 'assistant', text: data.content }]);
//             setResponse(data);

//             if (data.action === 'openWebpage' && data.payload?.url) {
//                 console.log("Attempting to open URL:", data.payload.url);
//                 try {
//                     let url = data.payload.url;
//                     if (!url.startsWith('http')) url = 'https://' + url;

//                     const newWindow = window.open(url, '_blank');
//                     console.log("window.open result:", newWindow);

//                     if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
//                         throw new Error("Popup blocked");
//                     }
//                 } catch (e) {
//                     console.error("Failed to open URL:", e);
//                     speak("I tried to open the page, but your browser blocked the popup. Please allow popups for this site.");
//                     return; // Don't speak the normal content if we just warned about popups to avoid talking over ourselves
//                 }
//             } else if (data.action === 'clearChat') {
//                 setHistory([]);
//                 setResponse(null);
//             }

//             speak(data.content);

//         } catch (error) {
//             console.error("Error:", error);
//             setLastError(error.message);
//             speak("Sorry, I encountered an error.");
//         } finally {
//             setIsProcessing(false);
//         }
//     };

//     // Auto-start listening on mount
//     useEffect(() => {
//         // We start in "Wake Word" mode (isManualMode = false)
//         SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });
//     }, []);

//     const toggleListening = () => {
//         if (listening) {
//             SpeechRecognition.stopListening();
//             window.speechSynthesis.cancel();
//             setIsAiSpeaking(false);
//             setIsManualMode(false);
//         } else {
//             resetTranscript();
//             setResponse(null);
//             setLastError(null);
//             // Click enables Manual Mode (skip wake word for first interaction)
//             setIsManualMode(true);
//             SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });
//         }
//     };

//     const cancelSpeech = () => {
//         window.speechSynthesis.cancel();
//         setIsAiSpeaking(false);
//         resetTranscript();
//         setIsManualMode(true);
//     };

//     const stopListening = () => {
//         SpeechRecognition.stopListening();
//         window.speechSynthesis.cancel();
//     };

//     return {
//         transcript,
//         listening,
//         isProcessing,
//         response,
//         history,
//         lastError,
//         startListening: toggleListening,
//         stopListening: toggleListening,
//         cancelSpeech,
//         browserSupportsSpeechRecognition,
//         isAiSpeaking,
//         isManualMode
//     };
// };
import { useState, useEffect, useCallback } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';

// Backend URL - ensure this matches your backend port
const BACKEND_URL = 'https://voice-agent-j3at.onrender.com/api/voice';

export const useVoice = () => {
    const [response, setResponse] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [history, setHistory] = useState([]);
    const [lastError, setLastError] = useState(null);
    const [sessionId] = useState(() => localStorage.getItem('sessionId') || `sess_${Date.now()}`);

    useEffect(() => {
        localStorage.setItem('sessionId', sessionId);
    }, [sessionId]);

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    const [isAiSpeaking, setIsAiSpeaking] = useState(false);

    const speak = useCallback((text) => {
        if (!text) return;

        setIsAiSpeaking(true);

        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('en-US')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = () => {
            setIsAiSpeaking(false);
            resetTranscript();
            setIsManualMode(true);

            if (window.followUpTimer) clearTimeout(window.followUpTimer);
            window.followUpTimer = setTimeout(() => {
                setIsManualMode(false);
            }, 10000);
        };

        utterance.onerror = () => {
            setIsAiSpeaking(false);
            resetTranscript();
        };

        window.speechSynthesis.speak(utterance);
    }, [resetTranscript]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (isAiSpeaking && !window.speechSynthesis.speaking) {
                setIsAiSpeaking(false);
                setIsManualMode(true);
            }
        }, 500);
        return () => clearInterval(interval);
    }, [isAiSpeaking]);

    const [isManualMode, setIsManualMode] = useState(false);

    useEffect(() => {
        if (listening && transcript) {

            if (isAiSpeaking) {
                const lower = transcript.toLowerCase();
                const stopWords = ["stop", "wait", "cancel", "hey", "jarvis", "jervis", "no", "wrong", "change", "play", "listen", "start", "open"];

                if (stopWords.some(word => lower.includes(word))) {
                    cancelSpeech();
                } else {
                    if (transcript.length > 200) resetTranscript();
                }
                return;
            }

            if (isProcessing) return;

            const timer = setTimeout(() => {
                if (transcript.trim().length > 0) {
                    const lowerTranscript = transcript.toLowerCase();

                    if (isManualMode) {
                        processInput(true);
                        setIsManualMode(false);
                    } else {
                        if (lowerTranscript.includes("jarvis") || lowerTranscript.includes("jervis")) {
                            const parts = lowerTranscript.split(/jarvis|jervis/);
                            const command = parts[parts.length - 1].trim();

                            if (command.length > 2) {
                                processInput(true, command);
                            } else {
                                resetTranscript();

                                const utterance = new SpeechSynthesisUtterance("Yes?");
                                const voices = window.speechSynthesis.getVoices();
                                const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('en-US')) || voices[0];
                                if (preferredVoice) utterance.voice = preferredVoice;

                                utterance.onend = () => {
                                    setIsManualMode(true);
                                };

                                window.speechSynthesis.speak(utterance);
                            }
                        } else {
                            if (transcript.length > 100) resetTranscript();
                        }
                    }
                }
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [transcript, listening, isManualMode, isAiSpeaking, isProcessing, resetTranscript]);

    const processInput = async (inputOver = false, cleanText = null) => {
        const textToProcess = cleanText || transcript;
        if (!textToProcess) return;

        setIsProcessing(true);
        resetTranscript();

        try {
            setHistory(prev => [...prev, { type: 'user', text: textToProcess }]);

            const res = await axios.post(BACKEND_URL, {
                text: textToProcess,
                sessionId
            });

            const data = res.data;

            setHistory(prev => [...prev, { type: 'assistant', text: data.content }]);
            setResponse(data);

            if (data.action === 'openWebpage' && data.payload?.url) {
                try {
                    let url = data.payload.url;
                    if (!url.startsWith('http')) url = 'https://' + url;
                    const newWindow = window.open(url, '_blank');
                    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                        throw new Error("Popup blocked");
                    }
                } catch (e) {
                    speak("I tried to open the page, but your browser blocked the popup. Please allow popups for this site.");
                    return;
                }
            } else if (data.action === 'clearChat') {
                setHistory([]);
                setResponse(null);
            }

            speak(data.content);

        } catch (error) {
            setLastError(error.message);
            speak("Sorry, I encountered an error.");
        } finally {
            setIsProcessing(false);
        }
    };

    // *** FIX: only start mic on user action ***
    const toggleListening = () => {
        if (listening) {
            SpeechRecognition.stopListening();
            window.speechSynthesis.cancel();
            setIsAiSpeaking(false);
            setIsManualMode(false);
        } else {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    resetTranscript();
                    setResponse(null);
                    setLastError(null);
                    setIsManualMode(true);
                    SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });
                })
                .catch(err => {
                    console.error("Microphone blocked:", err);
                    alert("Microphone access denied. Enable microphone permissions in browser settings.");
                });
        }
    };

    const cancelSpeech = () => {
        window.speechSynthesis.cancel();
        setIsAiSpeaking(false);
        resetTranscript();
        setIsManualMode(true);
    };

    const stopListening = () => {
        SpeechRecognition.stopListening();
        window.speechSynthesis.cancel();
    };

    return {
        transcript,
        listening,
        isProcessing,
        response,
        history,
        lastError,
        startListening: toggleListening,
        stopListening: toggleListening,
        cancelSpeech,
        browserSupportsSpeechRecognition,
        isAiSpeaking,
        isManualMode
    };
};
