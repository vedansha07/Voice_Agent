import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = 'https://voice-agent-e9g3.vercel.app/api/voice'; // Updated to local for consistency with TTS

export const useVoice = () => {
    const [response, setResponse] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [history, setHistory] = useState([]);
    const [lastError, setLastError] = useState(null);
    const [sessionId] = useState(() => localStorage.getItem('sessionId') || `sess_${Date.now()}`);

    // Native Speech Recognition State
    const [transcript, setTranscript] = useState("");
    const [listening, setListening] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isManualMode, setIsManualMode] = useState(false);

    const recognitionRef = useRef(null);
    const isIntentionalStop = useRef(false); // Track if we stopped it on purpose

    // Browser Support Check
    const browserSupportsSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

    useEffect(() => {
        localStorage.setItem('sessionId', sessionId);
    }, [sessionId]);

    // Initialize Recognition on Mount
    useEffect(() => {
        if (!browserSupportsSpeechRecognition) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
            console.log("Mic started");
            setListening(true);
            setLastError(null);
        };

        recognition.onend = () => {
            console.log("Mic stopped. Intentional:", isIntentionalStop.current);
            setListening(false);

            // If we didn't stop it on purpose, restart it
            if (!isIntentionalStop.current) {
                console.log("Restarting mic...");
                try {
                    recognition.start();
                } catch (e) {
                    console.error("Failed to auto-restart:", e);
                }
            }
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            setTranscript(finalTranscript);
        };

        recognition.onerror = (event) => {
            console.error("Speech Error:", event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setLastError(`Mic Error: ${event.error}`);
                isIntentionalStop.current = true; // Stop retrying if permission denied
                setListening(false);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                isIntentionalStop.current = true;
                recognitionRef.current.stop();
            }
        };
    }, []);

    const stopRecognition = () => {
        if (recognitionRef.current) {
            isIntentionalStop.current = true;
            recognitionRef.current.stop();
        }
    };

    const startRecognition = () => {
        setTranscript("");
        isIntentionalStop.current = false;
        try {
            recognitionRef.current?.start();
        } catch (e) {
            console.error("Start error:", e);
        }
    };

    const audioRef = useRef(null);

    const speak = useCallback(async (text) => {
        if (!text) return;

        setIsAiSpeaking(true);
        stopRecognition();

        try {
            // Fetch raw audio Blob from backend
            const response = await axios.post('https://voice-agent-e9g3.vercel.app/api/speak', { text }, { responseType: 'blob' });

            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            // Create a temporary local URL for the Blob
            const audioUrl = URL.createObjectURL(response.data);
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                setIsAiSpeaking(false);
                setIsManualMode(true);
                startRecognition();

                // Free up memory
                URL.revokeObjectURL(audioUrl);

                if (window.followUpTimer) clearTimeout(window.followUpTimer);
                window.followUpTimer = setTimeout(() => setIsManualMode(false), 10000);
            };

            audio.onerror = (e) => {
                console.error("Audio Playback Error Details (Deepgram Blob):", e);
                setIsAiSpeaking(false);
                startRecognition();
                URL.revokeObjectURL(audioUrl);
            };

            try {
                await audio.play();
            } catch (playError) {
                console.error("Failed to start audio playback:", playError);
                setIsAiSpeaking(false);
                startRecognition();
            }

        } catch (error) {
            console.error("TTS Fetch Error:", error);
            setIsAiSpeaking(false);
            startRecognition();
        }

    }, []);

    // Command Processing Logic
    useEffect(() => {
        if (!listening || !transcript || isProcessing || isAiSpeaking) return;

        const timer = setTimeout(() => {
            if (transcript.trim().length > 0) {
                const lower = transcript.toLowerCase();

                if (isManualMode) {
                    processInput(true);
                } else {
                    // Wake Word logic
                    if (lower.includes("jarvis")) {
                        const parts = lower.split("jarvis");
                        const command = parts[parts.length - 1].trim();

                        if (command.length > 2) {
                            // Wake word + command (e.g., "Jarvis turn on lights")
                            processInput(true, command);
                        } else {
                            // Wake word only (e.g., "Jarvis")
                            // 1. Stop mic to prevent capturing "Jarvis" again or self-noise
                            stopRecognition();
                            setTranscript("");

                            // 2. Acknowledge found
                            speak("Yes?");
                        }
                    } else {
                        // Clear buffer if it gets too long without wake word
                        if (transcript.length > 100) setTranscript("");
                    }
                }
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [transcript, listening, isProcessing, isAiSpeaking, isManualMode]);


    const processInput = async (inputOver = false, cleanText = null) => {
        const textToProcess = cleanText || transcript;
        if (!textToProcess) return;

        setIsProcessing(true);
        stopRecognition(); // Stop mic immediately

        try {
            setHistory(prev => [...prev, { type: 'user', text: textToProcess }]);

            console.log("Sending to backend:", textToProcess);
            const res = await axios.post(BACKEND_URL, {
                text: textToProcess,
                sessionId
            });

            const data = res.data;
            setHistory(prev => [...prev, { type: 'assistant', text: data.content }]);
            setResponse(data);

            if (data.action === 'openWebpage' && data.payload?.url) {
                window.open(data.payload.url, '_blank');
            } else if (data.action === 'clearChat') {
                setHistory([]);
            }

            speak(data.content);

        } catch (error) {
            console.error("Backend Error:", error);
            setLastError(error.message);
            speak("Sorry, something went wrong.");
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleListening = () => {
        // Unlock audio on first interaction! Many browsers block Audio.play() otherwise.
        if (!audioRef.current) {
            audioRef.current = new Audio();
            // Optional: play a silent base64 or empty sound to formally register an interaction
            audioRef.current.play().catch(e => console.log("Audio unlock silently failed:", e));
        }

        if (listening) {
            stopRecognition();
        } else {
            setIsManualMode(true);
            startRecognition();
        }
    };

    const cancelSpeech = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setIsAiSpeaking(false);
        setTranscript("");
        setIsManualMode(true);
        startRecognition();
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
