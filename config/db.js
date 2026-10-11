// config/db.js
// Handles the connection to MongoDB using Mongoose.
// The URI comes from .env -> MONGO_URI=mongodb://localhost:27017/jobconnect
// This matches the local database you'll see inside MongoDB Compass.

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // Exit the process if we can't connect to the DB - no point running the server without it
    process.exit(1);
  }
};

module.exports = connectDB;
