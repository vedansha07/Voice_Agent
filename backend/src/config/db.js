const mongoose = require('mongoose');

let lastMongoError = null;

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        lastMongoError = 'MONGO_URI environment variable is not set';
        console.error('CRITICAL:', lastMongoError);
        return;
    }
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        lastMongoError = null;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        lastMongoError = error.message;
        console.error(`MongoDB Connection Failed: ${error.message}`);
    }
};

const getLastMongoError = () => lastMongoError;

module.exports = connectDB;
module.exports.getLastMongoError = getLastMongoError;
