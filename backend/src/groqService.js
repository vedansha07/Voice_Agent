/**
 * groqService.js
 * Handles interaction with Groq API.
 */
const Groq = require('groq-sdk');
const { retrieveRelevantDocs } = require('./services/ragService');
const { retrieveMemory } = require('./services/memoryService');

let groq;

const initGroq = (apiKey) => {
    if (!apiKey) {
        console.warn("CRITICAL: GROQ API Key is missing!");
        return;
    }
    console.log("Groq Service initialized");
    groq = new Groq({ apiKey });
};

const SYSTEM_INSTRUCTION = `
You are a highly advanced Voice Assistant with direct control over the user's browser.
You are NOT just a text-based assistant; you can and MUST execute actions on the frontend.

YOUR CAPABILITIES:
1. You can OPEN any website (Google, YouTube, etc.) by sending the 'openWebpage' action.
2. You can CLEAR the chat history by sending the 'clearChat' action.
3. You can speak any language (Hindi, English, etc.).

RULES:
- NEVER say "I cannot open webpages". You CAN. Just send the JSON action.
- If the user asks to "Open [Site]", ALWAYS return action: 'openWebpage'.
- If the user asks to "Search [Query]", ALWAYS return action: 'openWebpage' with a Google Search URL.
- Reply concisely.

Actions available: 
- 'none' (payload: {}) -> Use this for ALL normal conversational replies, greetings, and goodbyes.
- 'getTime' (payload: {})
- 'openWebpage' (payload: { url: string })
- 'clearChat' (payload: {})

Instructions:
1. For weather requests (e.g., "Weather in Pune"), DO NOT just tell the weather. instead OPEN a google search for it: 
   action: 'openWebpage', payload: { url: "https://www.google.com/search?q=weather+in+Pune" }
   Content: "Opening weather for Pune."
2. For general search requests, use 'openWebpage' with url: "https://www.google.com/search?q=<query>"
3. For opening specific sites (YouTube, Google), use 'openWebpage' with the correct URL.
4. RAG Fallback: If the user explicitly asks about the uploaded document, and it cannot be answered by the DOCUMENT CONTEXT, reply exactly: "I couldn't find this in your uploaded documents. I can look it up online if you want." (DO NOT use this fallback for normal conversational questions, or information that is already present in your chat history/memory).
5. If you suggested looking it up online in the previous turn, and the user confirms (e.g. "yes", "sure", "ok"), you MUST trigger the 'openWebpage' action with a Google search for their preceding question.
6. Prioritize Knowledge: DOCUMENT CONTEXT > MEMORY CONTEXT > Base Knowledge. Use contextual information if relevant.

Structure:
{
  "type": "reply",
  "content": "Text to be spoken to the user",
  "action": "actionName",
  "payload": { ... }
}
`;

const generateResponse = async (userText, history = [], isGuest = false, userId = null) => {
    if (!groq) {
        throw new Error("Groq client not initialized");
    }

    // Convert history from Gemini format to Groq/OpenAI format if needed
    // Groq: { role: 'user', content: '...' }

    const formattedHistory = history.map(msg => {
        let content = '';
        if (Array.isArray(msg.parts)) {
            content = msg.parts.map(p => p.text).join('');
        } else {
            content = msg.content || '';
        }
        // Map 'model' role to 'assistant' for Groq
        let role = msg.role === 'model' ? 'assistant' : msg.role;
        return { role, content };
    });

    // Inject current date/time to make the agent context-aware
    const currentDateTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
    
    // Inject Memory Context based on Guest status
    const memoryInstruction = isGuest 
        ? "You are currently interacting with a Guest user. Their conversation history is only saved temporarily for this active session. If they ask about memory, inform them that their history will be lost on refresh and they must log in to securely save their conversations permanently to the database."
        : "You DO have long-term memory across sessions, because your conversations are securely saved to a MongoDB database. NEVER claim that you will forget information when the session ends or browser closes. You can remember details permanently.";

    let docContextInfo = "";
    let memContextInfo = "";

    if (userId) {
        try {
            const [docResult, memResult] = await Promise.all([
                retrieveRelevantDocs(userText, userId),
                retrieveMemory(userText, userId)
            ]);

            if (docResult && docResult.found) {
                docContextInfo = `\nDOCUMENT CONTEXT (Priority: HIGH):\n` 
                    + docResult.results.map((r, i) => `[Doc ${i+1}] (score: ${r.score.toFixed(2)}): ${r.text}`).join('\n');
            }

            if (memResult && memResult.found) {
                memContextInfo = `\nMEMORY CONTEXT (Priority: MEDIUM):\n` 
                    + memResult.results.map((r, i) => `[Mem ${i+1} ${r.role}] (score: ${r.score.toFixed(2)}): ${r.text}`).join('\n');
            }
        } catch (err) {
            console.error("Context retrieval error:", err);
        }
    }

    const dynamicSystemInstruction = `${SYSTEM_INSTRUCTION}\n\nMEMORY STATUS: ${memoryInstruction}\n\nCURRENT SYSTEM DATE AND TIME: ${currentDateTime}.${docContextInfo}${memContextInfo}`;

    const messages = [
        { role: "system", content: dynamicSystemInstruction },
        ...formattedHistory,
        { role: "user", content: userText }
    ];

    try {
        // Verify messages are valid (non-empty content)
        const validMessages = messages.map(m => ({
            role: m.role,
            content: m.content || " " // Ensure strictly non-empty
        }));

        const completion = await groq.chat.completions.create({
            messages: validMessages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.6,
            max_tokens: 1024,
            response_format: { type: "json_object" },
        });

        const text = completion.choices[0]?.message?.content || "{}";

        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse Groq response:", text);
            return {
                type: "reply",
                content: "I processed that, but had a glitch formatting the response.",
                action: "none",
                payload: {}
            };
        }

    } catch (error) {
        console.error("Groq API Error:", error);
        // Return a safe fallback response instead of throwing 500
        return {
            type: "reply",
            content: "I'm having trouble connecting to my brain right now. Please try again.",
            action: "none",
            payload: {}
        };
    }
};

const handleToolOutput = async (originalText, history, action, actionResult, isGuest = false) => {
    const toolOutputMessage = `
System Tool Output for action '${action}':
${JSON.stringify(actionResult)}

Instruction: Generate a JSON response { "type": "reply", "content": "...", "action": "none", "payload": {} } to answer the user based on this tool output.
`;

    // Construct new history for the follow-up
    // Note: We need to respect the format expected by generateResponse
    const followUpHistory = [
        ...history,
        { role: 'user', content: originalText },
        { role: 'assistant', content: JSON.stringify({ action, payload: {} }) }, // Minimal representation of previous turn
        { role: 'user', content: toolOutputMessage }
    ];

    try {
        const finalResponse = await generateResponse("Generate final response based on tool output", followUpHistory, isGuest, null);
        return finalResponse;
    } catch (error) {
        console.error("[GroqService] Re-prompt failed:", error);
        return {
            type: "reply",
            content: "I have the data but couldn't generate a summary. Please check the logs.",
            action: "none",
            payload: {}
        };
    }
};

module.exports = { initGroq, generateResponse, handleToolOutput };
