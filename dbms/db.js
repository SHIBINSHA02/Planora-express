// dbms/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongooseURL = process.env.CONNECTION_STRING || 'mongodb://localhost:27017/planora';

        const conn = await mongoose.connect(mongooseURL);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;