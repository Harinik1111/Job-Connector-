// controllers/authController.js
// Handles user registration and login. Passwords are hashed automatically
// by the User model's pre-save hook (bcrypt) - we never store plain text.

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to create a signed JWT for a given user id
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route  POST /api/auth/register
// @access Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, companyName } = req.body;

    // Basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are all required' });
    }
    if (!['Job Seeker', 'Recruiter'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either "Job Seeker" or "Recruiter"' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check for existing user with this email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password, // gets hashed automatically via the pre-save hook
      role,
      companyName: role === 'Recruiter' ? companyName || '' : ''
    });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName
      }
    });
  } catch (err) {
    // Handle duplicate key error from the unique email index as a friendly message
    if (err.code === 11000) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @route  POST /api/auth/login
// @access Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Explicitly select password since the schema hides it by default
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @route  GET /api/auth/company-profile
// @access Private (Recruiter only) - returns the logged-in recruiter's company info
const getCompanyProfile = async (req, res) => {
  res.json({
    companyName: req.user.companyName || '',
    companyDescription: req.user.companyDescription || '',
    companyWebsite: req.user.companyWebsite || '',
    companyLocation: req.user.companyLocation || ''
  });
};

// @route  PUT /api/auth/company-profile
// @access Private (Recruiter only) - create/update the recruiter's company profile
const updateCompanyProfile = async (req, res) => {
  try {
    const { companyName, companyDescription, companyWebsite, companyLocation } = req.body;

    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ message: 'Company name cannot be empty' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        companyName: companyName.trim(),
        companyDescription: companyDescription || '',
        companyWebsite: companyWebsite || '',
        companyLocation: companyLocation || ''
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Company profile saved',
      companyName: user.companyName,
      companyDescription: user.companyDescription,
      companyWebsite: user.companyWebsite,
      companyLocation: user.companyLocation
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error saving company profile' });
  }
};

module.exports = { registerUser, loginUser, getCompanyProfile, updateCompanyProfile };
