// routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const { createJob, getJobs, getMyJobs, getJobById } = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

// IMPORTANT: specific routes like "/my" must be declared BEFORE "/:id"
// otherwise Express will treat "my" as an :id value.
router.get('/my', protect, authorize('Recruiter'), getMyJobs);
router.get('/', protect, getJobs); // search/filter - any logged-in user (seeker or recruiter)
router.get('/:id', protect, getJobById);
router.post('/', protect, authorize('Recruiter'), createJob); // recruiter-only job creation

module.exports = router;
