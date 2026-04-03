const MemoryChunk = require('../models/MemoryChunk');
const { getEmbedding } = require('./ragService');

const vectorizeMessage = async (text, role, userId, sessionId) => {
    // Only vectorize meaningful messages
    if (!text || text.trim().length === 0) return null;
    if (role !== 'user' && role !== 'assistant') return null;
    
    // Ignore overly short, non-meaningful assistant outputs (like "Opening Google" or purely JSON action confirmations that lack conversational depth)
    if (role === 'assistant' && text.length < 15) return null;
    
    // Do not vectorize JSON objects, just normal conversational text.
    if (text.trim().startsWith('{') && text.trim().endsWith('}')) return null;

    try {
        const embedding = await getEmbedding(text);
        
        const chunk = new MemoryChunk({
            text,
            embedding,
            userId,
            sessionId,
            role
        });

        await chunk.save();
        return chunk;
    } catch (err) {
        console.error("Error vectorizing memory message:", err.message);
        return null;
    }
};

const retrieveMemory = async (query, userId) => {
    try {
        const queryEmbedding = await getEmbedding(query);

        // Use MongoDB Atlas $vectorSearch for memory
        const results = await MemoryChunk.aggregate([
            {
                $vectorSearch: {
                    index: 'vector_index', // Adjusted to explicitly match Atlas configuration
                    path: 'embedding',
                    queryVector: queryEmbedding,
                    numCandidates: 100,
                    limit: 20
                }
            },
            {
                $match: { userId }
            },
            {
                $limit: 2
            },
            {
                $project: {
                    text: 1,
                    role: 1,
                    score: { $meta: 'vectorSearchScore' }
                }
            }
        ]);

        const highestScore = results.length > 0 ? results[0].score : 0;
        
        // Lower threshold for memory (conversational context) compared to strict RAG
        if (highestScore < 0.65) {
            return {
                found: false,
                results: []
            };
        }

        return {
            found: true,
            results: results.map(r => ({ role: r.role, text: r.text, score: r.score }))
        };

    } catch (err) {
        console.error("Vector search for memory failed, fallback triggered:", err.message);
        try {
            const fallbackResults = await MemoryChunk.aggregate([
                {
                    $vectorSearch: {
                        index: 'vector_index',
                        path: 'embedding',
                        queryVector: queryEmbedding,
                        numCandidates: 100,
                        limit: 10
                    }
                },
                {
                    $match: { userId }
                },
                {
                    $limit: 2
                },
                {
                    $project: {
                        text: 1,
                        role: 1,
                        score: { $meta: 'vectorSearchScore' }
                    }
                }
            ]);

            const highestScore = fallbackResults.length > 0 ? fallbackResults[0].score : 0;
            if (highestScore < 0.65) return { found: false, results: [] };
            
            return {
                found: true,
                results: fallbackResults.map(r => ({ role: r.role, text: r.text, score: r.score }))
            };
        } catch (innerErr) {
            console.error("Fallback memory search also failed:", innerErr.message);
            return { found: false, results: [] };
        }
    }
};

module.exports = {
    vectorizeMessage,
    retrieveMemory
};
