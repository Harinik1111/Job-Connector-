// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getCompanyProfile,
  updateCompanyProfile
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);

// Company profile - a distinct capability from register/login, Recruiter-only
router.get('/company-profile', protect, authorize('Recruiter'), getCompanyProfile);
router.put('/company-profile', protect, authorize('Recruiter'), updateCompanyProfile);

module.exports = router;
