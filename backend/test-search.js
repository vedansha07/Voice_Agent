require('dotenv').config();
const mongoose = require('mongoose');
const { getEmbedding } = require('./src/services/ragService.js');
const RagChunk = require('./src/models/RagChunk.js');

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    const text = 'What are the projects listed in the document';
    const emb = await getEmbedding(text);
    
    // Test the exact new agg pipeline
    const results = await RagChunk.aggregate([
        {
            $vectorSearch: {
                index: 'vector_index',
                path: 'embedding',
                queryVector: emb,
                numCandidates: 100,
                limit: 20
            }
        },
        {
            $match: { userId: '69c2ef4ce395e0a8c93b37be' }
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

    console.log("Found chunks:", results.length);
    results.forEach((r, i) => console.log(`[${i}] (score: ${r.score}):`, r.text.substring(0, 100).replace(/\n/g, " ")));
    process.exit(0);
}
test();
