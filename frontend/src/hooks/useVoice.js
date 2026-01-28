import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = 'https://voice-agent-j3at.onrender.com/api/voice';

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
            console.log("Mic stopped");
            setListening(false);
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
                setListening(false);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    const stopRecognition = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
    };

    const startRecognition = () => {
        setTranscript("");
        try {
            recognitionRef.current?.start();
        } catch (e) {
            console.error("Start error:", e);
        }
    };

    const speak = useCallback((text) => {
        if (!text) return;
        setIsAiSpeaking(true);
        stopRecognition(); // Stop listening while talking to prevent ECHO

        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('en-US')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = () => {
            setIsAiSpeaking(false);
            setIsManualMode(true);
            startRecognition(); // Restart listening after speech ends

            if (window.followUpTimer) clearTimeout(window.followUpTimer);
            window.followUpTimer = setTimeout(() => setIsManualMode(false), 10000);
        };

        utterance.onerror = () => {
            setIsAiSpeaking(false);
            startRecognition();
        };

        window.speechSynthesis.speak(utterance);
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
                            processInput(true, command);
                        } else {
                            // Wake word only
                            stopRecognition();
                            setTranscript("");
                            const utterance = new SpeechSynthesisUtterance("Yes?");
                            utterance.onend = () => {
                                setIsManualMode(true);
                                startRecognition();
                            };
                            window.speechSynthesis.speak(utterance);
                        }
                    } else {
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
        if (listening) {
            stopRecognition();
        } else {
            setIsManualMode(true);
            startRecognition();
        }
    };

    const cancelSpeech = () => {
        window.speechSynthesis.cancel();
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
