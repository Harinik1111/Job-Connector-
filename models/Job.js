// models/Job.js
// A job posting created by a Recruiter. "skills" is the JobSkills mapping,
// implemented as an array of references into the normalized Skill collection.

const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      validate: {
        validator: (v) => v && v.trim().length > 0,
        message: 'Title cannot be empty'
      }
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
      validate: {
        validator: (v) => v && v.trim().length > 0,
        message: 'Description cannot be empty'
      }
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    job_type: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'],
      required: true
    },
    experience_required: {
      type: Number, // in years
      default: 0,
      min: 0
    },
    salary_range: {
      type: String, // kept simple as free text e.g. "6-10 LPA" for a beginner project
      trim: true,
      default: 'Not disclosed'
    },
    // Normalized many-to-many mapping to Skill collection (the "JobSkills" table)
    skills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill'
      }
    ]
  },
  { timestamps: true }
);

// Helpful indexes for search/filter performance
jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ location: 1 });
jobSchema.index({ job_type: 1 });

module.exports = mongoose.model('Job', jobSchema);
