const mongoose = require('mongoose');

const memoryChunkSchema = new mongoose.Schema({
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
    sessionId: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MemoryChunk', memoryChunkSchema, 'memory_chunks');
