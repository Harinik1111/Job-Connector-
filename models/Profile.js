// models/Profile.js
// Extended profile info for a Job Seeker. Linked 1-to-1 with User via
// the "user" field (foreign key reference).

const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // one profile per user
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    qualification: {
      type: String,
      trim: true,
      default: ''
    },
    experience: {
      type: Number, // years of experience
      default: 0,
      min: 0
    },
    // Many-to-many relationship to the normalized Skill collection
    skills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill'
      }
    ],
    resume_url: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
