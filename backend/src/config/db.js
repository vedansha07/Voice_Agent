const mongoose = require('mongoose');

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.error('CRITICAL: MONGO_URI environment variable is not set.');
        return;
    }
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // Do NOT call process.exit(1) in serverless — it kills the entire function instance.
        // Routes will handle DB-unavailable scenarios gracefully with 503 responses.
        console.error(`MongoDB Connection Failed: ${error.message}`);
    }
};

module.exports = connectDB;
