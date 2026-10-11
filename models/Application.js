// models/Application.js
// Represents a Job Seeker applying to a Job. Enforces one application
// per (job, applicant) pair using a composite unique index - this is
// the Mongo equivalent of "UNIQUE(job_id, applicant_id)" in SQL.

const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['Applied', 'Shortlisted', 'Rejected'],
      default: 'Applied'
    },
    applied_date: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Composite unique constraint: a given applicant can only apply once to a given job.
// If a duplicate insert is attempted, MongoDB throws error code 11000 (handled in the controller).
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
