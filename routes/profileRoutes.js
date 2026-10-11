// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const { getMyProfile, upsertProfile } = require('../controllers/profileController');
const { protect, authorize } = require('../middleware/auth');

// All profile routes require login, and are for Job Seekers only
router.get('/me', protect, authorize('Job Seeker'), getMyProfile);
router.post('/', protect, authorize('Job Seeker'), upsertProfile);

module.exports = router;
