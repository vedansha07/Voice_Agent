const mongoose = require('mongoose');

let connectionPromise = null;
let lastMongoError = null;

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        lastMongoError = 'MONGO_URI environment variable is not set';
        console.error('CRITICAL:', lastMongoError);
        return Promise.reject(new Error(lastMongoError));
    }

    // Already fully connected — reuse (warm Vercel invocation)
    if (mongoose.connection.readyState === 1) {
        return Promise.resolve();
    }

    // Connection already in flight — share it (prevents duplicate connections)
    if (connectionPromise) {
        return connectionPromise;
    }

    // Start a fresh connection attempt
    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
        bufferCommands: false,  // Fail fast — don't buffer ops while disconnected
    })
    .then(conn => {
        lastMongoError = null;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    })
    .catch(error => {
        lastMongoError = error.message;
        connectionPromise = null; // Reset so the next request retries
        console.error(`MongoDB Connection Failed: ${error.message}`);
        throw error;
    });

    return connectionPromise;
};

const getLastMongoError = () => lastMongoError;

module.exports = connectDB;
module.exports.getLastMongoError = getLastMongoError;
