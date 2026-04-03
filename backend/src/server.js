// /**
//  * server.js
//  * Main entry point for the backend.
//  */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initGroq, generateResponse, handleToolOutput } = require('./groqService');
const { executeCommand } = require('./commandDispatcher');
const connectDB = require('./config/db');
const { checkJwt } = require('./middleware/auth');
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const multer = require('multer');
const { processAndStoreDocument } = require('./services/ragService');
const { vectorizeMessage } = require('./services/memoryService');


const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage() });

connectDB().then(() => {
    // Drop the overly strict index if it exists to fix Guest Mode session swaps
    Conversation.collection.dropIndex('sessionId_1').catch(err => {
        // Ignored if index does not exist
    });
});

app.use(cors({
    origin: [
        "https://voice-agent-fawn.vercel.app",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:4174"
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false
}));

app.options('/api/voice', (req, res) => {
    res.sendStatus(200);
});

app.use(express.json());

initGroq(process.env.GROQ_API_KEY);

app.get('/', (req, res) => {
    res.send('Voice Agent Backend is running');
});

app.post('/api/uploadDocument', checkJwt, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const sessionId = req.body.sessionId || 'default';
        const auth0Id = req.auth ? req.auth.payload.sub : `guest_${sessionId}`;
        const isGuest = auth0Id.startsWith('guest_');
        
        let user = await User.findOne({ auth0Id });
        if (!user) {
            user = new User({ 
                auth0Id, 
                email: isGuest ? `${auth0Id}@guest.local` : `${auth0Id}@auth0.local`, 
                name: isGuest ? 'Guest User' : 'New User',
                picture: ''
            });
            await user.save();
        }

        const result = await processAndStoreDocument(req.file.buffer, user._id.toString(), sessionId);
        res.json(result);
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ error: error.message || 'Internal server error while processing document' });
    }
});

app.post('/api/user/sync', checkJwt, async (req, res) => {
    if (!req.auth) return res.json({ message: "Guest Mode - No Sync Required" });
    try {
        const auth0Id = req.auth.payload.sub;
        const { email, name, picture } = req.body;
        
        let user = await User.findOne({ auth0Id });
        if (!user) {
            user = new User({ auth0Id, email, name, picture });
            await user.save();
        } else {
            user.email = email || user.email;
            user.name = name || user.name;
            user.picture = picture || user.picture;
            await user.save();
        }
        res.json(user);
    } catch (error) {
        console.error('Error syncing user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/voice', checkJwt, async (req, res) => {
    const { text, sessionId } = req.body;
    const auth0Id = req.auth ? req.auth.payload.sub : `guest_${sessionId}`;
    const isGuest = auth0Id.startsWith('guest_');

    if (!text || !sessionId) {
        return res.status(400).json({ error: 'Missing text or sessionId' });
    }

    try {
        let user = await User.findOne({ auth0Id });
        if (!user) {
            // Automatically create a document for Guests (or if the sync somehow failed for authenticated users)
            user = new User({ 
                auth0Id, 
                email: isGuest ? `${auth0Id}@guest.local` : `${auth0Id}@auth0.local`, 
                name: isGuest ? 'Guest User' : 'New User',
                picture: ''
            });
            await user.save();
        }

        let conversation = await Conversation.findOne({ sessionId, userId: user._id });
        if (!conversation) {
            conversation = new Conversation({ sessionId, userId: user._id, messages: [] });
        }

        const history = conversation.messages.map(m => ({ role: m.role, content: m.content }));

        let geminiResponse = await generateResponse(text, history, isGuest, user._id.toString());

        if (geminiResponse.action !== 'none') {
            if (geminiResponse.action !== 'openWebpage' && geminiResponse.action !== 'clearChat') {
                const actionResult = await executeCommand(geminiResponse.action, geminiResponse.payload);
                if (actionResult) {
                    geminiResponse = await handleToolOutput(text, history, geminiResponse.action, actionResult, isGuest);
                }
            }
        }

        const userTurn = { role: 'user', content: text };
        const modelTurn = { role: 'assistant', content: JSON.stringify(geminiResponse) };

        conversation.messages.push(userTurn, modelTurn);
        await conversation.save();

        // Vectorize meaningful messages in background
        if (!isGuest) {
            vectorizeMessage(text, 'user', user._id.toString(), sessionId).catch(console.error);
            vectorizeMessage(geminiResponse.content, 'assistant', user._id.toString(), sessionId).catch(console.error);
        }

        res.json({ ...geminiResponse });

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

const { createClient } = require('@deepgram/sdk');

app.post('/api/speak', checkJwt, async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    try {
        const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

        const response = await deepgram.speak.request(
            { text },
            {
                model: 'aura-asteria-en',
                encoding: "linear16",
                container: "wav"
            }
        );

        const stream = await response.getStream();

        if (stream) {
            const reader = stream.getReader();

            res.set({
                'Content-Type': 'audio/wav'
            });

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    res.end();
                    break;
                }
                res.write(Buffer.from(value));
            }
        } else {
            throw new Error("No stream received from Deepgram");
        }

    } catch (error) {
        console.error("Deepgram TTS Error:", error);
        res.status(500).json({ error: "Deepgram TTS failed", details: error.message });
    }
});

// Vercel Serverless exports
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
module.exports = app;
