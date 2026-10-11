// routes/applicationRoutes.js
const express = require('express');
const router = express.Router();
const {
  applyToJob,
  getMyApplications,
  getApplicantsForJob,
  updateApplicationStatus
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

router.post('/:jobId', protect, authorize('Job Seeker'), applyToJob);
router.get('/my', protect, authorize('Job Seeker'), getMyApplications);
router.get('/job/:jobId', protect, authorize('Recruiter'), getApplicantsForJob);
router.put('/:id/status', protect, authorize('Recruiter'), updateApplicationStatus);

module.exports = router;
