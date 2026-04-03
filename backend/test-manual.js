require('dotenv').config();
const mongoose = require('mongoose');
const { getEmbedding } = require('./src/services/ragService.js');
const RagChunk = require('./src/models/RagChunk.js');

function dot(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
    return sum;
}

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    const emb = await getEmbedding('Can you give me a summary of the document');
    
    const docs = await RagChunk.find({});
    console.log("Docs found:", docs.length);
    
    let best = -1;
    for (const doc of docs) {
        if (doc.embedding && doc.embedding.length === 384) {
            const score = dot(emb, doc.embedding);
            if (score > best) best = score;
        }
    }
    console.log("Best manual dot-product score:", best);
    process.exit(0);
}
test();
