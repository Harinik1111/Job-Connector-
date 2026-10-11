// models/User.js
// Represents both Job Seekers and Recruiters. The "role" field decides
// which permissions a user has across the app.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // enforces uniqueness at the DB level (creates a unique index)
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false // never return password field by default in queries
    },
    role: {
      type: String,
      enum: ['Job Seeker', 'Recruiter'],
      required: [true, 'Role is required']
    },
    // Company profile fields - only relevant for Recruiters, managed via
    // the dedicated "Company Profile" screen (PUT /api/auth/company-profile)
    companyName: {
      type: String,
      trim: true,
      default: ''
    },
    companyDescription: {
      type: String,
      trim: true,
      default: ''
    },
    companyWebsite: {
      type: String,
      trim: true,
      default: ''
    },
    companyLocation: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true } // adds createdAt / updatedAt automatically
);

// Hash the password before saving, but only if it was modified (or is new)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare a plain-text password with the hashed one
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
