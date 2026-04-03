const mongoose = require('mongoose');

const ragChunkSchema = new mongoose.Schema({
    text: { type: String, required: true },
    embedding: {
        type: [Number],
        required: true,
        validate: {
            validator: function(v) {
                return v.length === 384;
            },
            message: 'Embedding must be exactly 384 dimensions.'
        }
    },
    userId: { type: String, required: true },
    documentId: { type: String, required: true },
    sessionId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Enforce collection name 'rag_chunks' as required
module.exports = mongoose.model('RagChunk', ragChunkSchema, 'rag_chunks');
