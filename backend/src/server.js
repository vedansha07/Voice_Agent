/**
 * server.js
 * Main entry point for the backend.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initGroq, generateResponse, handleToolOutput } = require('./groqService');
const { executeCommand } = require('./commandDispatcher');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Initialize Groq
initGroq(process.env.GROQ_API_KEY);

// In-memory session store
// Map<sessionId, Array<{role: string, parts: Array<{text: string}>}>>
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
        // Retrieve history
        const history = sessions.get(sessionId) || [];

        // Get response from Gemini
        let geminiResponse = await generateResponse(text, history);

        // Execute command if any
        if (geminiResponse.action !== 'none') {
            // Check if this is a client-side action that should be ignored by the backend
            if (geminiResponse.action === 'openWebpage' || geminiResponse.action === 'clearChat') {
                console.log(`[Server] Passing client-side action to frontend: ${geminiResponse.action}`);
                // Do NOT execute server-side. Pass through to frontend.
            } else {
                console.log(`[Server] Executing action: ${geminiResponse.action}`);
                const actionResult = await executeCommand(geminiResponse.action, geminiResponse.payload);

                if (actionResult) {
                    console.log(`[Server] Action result:`, actionResult);
                    geminiResponse = await handleToolOutput(text, history, geminiResponse.action, actionResult);
                }
            }
        }

        // Update history with user query and model response
        // Only store text parts for history
        const userTurn = { role: 'user', content: text };
        // We store the structured JSON response as text in history so the model knows what it said
        const modelTurn = { role: 'assistant', content: JSON.stringify(geminiResponse) };

        sessions.set(sessionId, [...history, userTurn, modelTurn]);

        // Send back to frontend
        res.json({
            ...geminiResponse
        });

    } catch (error) {
        console.error('Error processing request:', error);
        console.error('Stack:', error.stack);
        if (error.response) {
            console.error('Gemini API Error Detail:', JSON.stringify(error.response, null, 2));
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
