const pdfParse = require('pdf-parse');
const RagChunk = require('../models/RagChunk');
const embeddingCache = new Map();
let extractor = null;

const getEmbedding = async (text) => {
    if (embeddingCache.has(text)) {
        return embeddingCache.get(text);
    }
    
    try {
        if (!extractor) {
            // Dynamically import Xenova ESM module to bypass Vercel crash
            const xenova = await import('@xenova/transformers');
            
            // Set Vercel read-only bypass
            xenova.env.cacheDir = '/tmp/.cache';
            
            // Load the pipeline locally. The first run will download the model weights (~90MB).
            extractor = await xenova.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }

        const output = await extractor(text, { pooling: 'mean', normalize: true });
        
        // output.data is a Float32Array, convert it to standard JS array
        const embedding = Array.from(output.data);
        
        embeddingCache.set(text, embedding);
        return embedding;
    } catch (err) {
        console.error('Error generating local embedding:', err.message);
        throw err;
    }
};

const processAndStoreDocument = async (fileBuffer, userId, sessionId) => {
    try {
        // User requested STRICT single-document memory:
        // Delete all previously uploaded documents for this user before storing the new one!
        await RagChunk.deleteMany({ userId });

        const data = await pdfParse(fileBuffer);
        const text = data.text;

        // Dynamically import the ES Module to bypass Vercel's ERR_REQUIRE_ESM crash
        const { RecursiveCharacterTextSplitter } = await import('@langchain/textsplitters');

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 800,
            chunkOverlap: 120
        });

        const rawChunks = await splitter.createDocuments([text]);
        const documentId = `doc_${Date.now()}`;

        const chunksToAdd = rawChunks; // Reassigned directly since constraints are gone

        const ragChunks = [];
        for (const doc of chunksToAdd) {
            const chunkText = doc.pageContent;
            const embedding = await getEmbedding(chunkText);
            
            ragChunks.push({
                text: chunkText,
                embedding,
                userId,
                documentId,
                sessionId
            });
        }

        await RagChunk.insertMany(ragChunks);
        return { success: true, message: `Stored ${ragChunks.length} chunks`, documentId };
    } catch (error) {
        console.error('Error processing document:', error);
        throw error;
    }
};

const retrieveRelevantDocs = async (query, userId) => {
    try {
        const queryEmbedding = await getEmbedding(query);

        // Explicitly using MongoDB Atlas $vectorSearch
        const results = await RagChunk.aggregate([
            {
                $vectorSearch: {
                    index: 'vector_index', // Adjusted to match the verified remote Atlas vector index name
                    path: 'embedding',
                    queryVector: queryEmbedding,
                    numCandidates: 100,
                    limit: 15
                }
            },
            {
                $match: { userId }
            },
            {
                $limit: 15
            },
            {
                $project: {
                    text: 1,
                    score: { $meta: 'vectorSearchScore' }
                }
            }
        ]);

        const highestScore = results.length > 0 ? results[0].score : 0;
        
        // Threshold check (lowered for local MiniLM model broad queries)
        if (highestScore < 0.15) {
            return {
                found: false,
                results: []
            };
        }

        // Deduplicate chunks (in case user uploaded the same document multiple times)
        const uniqueResults = [];
        const seenTexts = new Set();
        for (const r of results) {
            if (!seenTexts.has(r.text)) {
                seenTexts.add(r.text);
                uniqueResults.push({ text: r.text, score: r.score });
            }
        }

        return {
            found: true,
            results: uniqueResults
        };

    } catch (err) {
        // Fallback for aggregation error if filter inside vectorSearch fails (index mismatch)
        console.error("Vector search failed, might be missing 'userId' in vector index config:", err.message);
        
        // Let's retry without the internal filter, applying $match immediately after (less optimal but safe)
        try {
            const fallbackResults = await RagChunk.aggregate([
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
                    $limit: 15
                },
                {
                    $project: {
                        text: 1,
                        score: { $meta: 'vectorSearchScore' }
                    }
                }
            ]);

            const highestScore = fallbackResults.length > 0 ? fallbackResults[0].score : 0;
            if (highestScore < 0.15) return { found: false, results: [] };
            
            const fallbackUnique = [];
            const fallbackSeen = new Set();
            for (const r of fallbackResults) {
                if (!fallbackSeen.has(r.text)) {
                    fallbackSeen.add(r.text);
                    fallbackUnique.push({ text: r.text, score: r.score });
                }
            }
            
            return {
                found: true,
                results: fallbackUnique
            };
        } catch (innerErr) {
            console.error("Fallback vector search also failed:", innerErr.message);
            return { found: false, results: [] };
        }
    }
};

module.exports = {
    processAndStoreDocument,
    retrieveRelevantDocs,
    getEmbedding // exported to share with memoryService to avoid dupe cache logic
};
