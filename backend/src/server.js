// /**
//  * server.js
//  * Main entry point for the backend.
//  */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initGroq, generateResponse, handleToolOutput } = require('./groqService');
const { executeCommand } = require('./commandDispatcher');
const keepAlive = require('./keepAlive');


const app = express();
const PORT = process.env.PORT || 3000;

keepAlive(app);

// Proper CORS for Vercel + Local Dev
app.use(cors({
    origin: [
        "https://voice-agent-fawn.vercel.app",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:4174"
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false
}));

// Preflight handler
app.options('/api/voice', (req, res) => {
    res.sendStatus(200);
});

app.use(express.json());

// Logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Init Groq
initGroq(process.env.GROQ_API_KEY);

// Sessions (in-memory)
const sessions = new Map();

app.get('/', (req, res) => {
    res.send('Voice Agent Backend is running');
});

app.post('/api/voice', async (req, res) => {
    const { text, sessionId } = req.body;

    if (!text || !sessionId) {
        return res.status(400).json({ error: 'Missing text or sessionId' });
    }

    console.log(`[${sessionId}] User says: ${text}`);

    try {
        const history = sessions.get(sessionId) || [];

        let geminiResponse = await generateResponse(text, history);

        if (geminiResponse.action !== 'none') {
            if (geminiResponse.action !== 'openWebpage' && geminiResponse.action !== 'clearChat') {
                const actionResult = await executeCommand(geminiResponse.action, geminiResponse.payload);
                if (actionResult) {
                    geminiResponse = await handleToolOutput(text, history, geminiResponse.action, actionResult);
                }
            }
        }

        const userTurn = { role: 'user', content: text };
        const modelTurn = { role: 'assistant', content: JSON.stringify(geminiResponse) };

        sessions.set(sessionId, [...history, userTurn, modelTurn]);

        res.json({ ...geminiResponse });

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
