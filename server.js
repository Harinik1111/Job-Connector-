// server.js
// Entry point for the JobConnect backend. Sets up Express, connects to
// MongoDB, mounts all API routes, and serves the static frontend from /public.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Route files
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');

const app = express();

// Connect to MongoDB (uses MONGO_URI from .env)
connectDB();

// Middleware
app.use(cors());
app.use(express.json()); // parses incoming JSON request bodies

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);

// Simple health check endpoint
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'JobConnect API is running' }));

// Serve the static frontend (plain HTML/CSS/JS) from the /public folder
app.use(express.static(path.join(__dirname, 'public')));

// Fallback: any non-API route serves the login page (simple multi-page app, no client router needed)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Generic error handler (catches anything unexpected that wasn't handled in a controller)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`JobConnect server running on http://localhost:${PORT}`);
});
