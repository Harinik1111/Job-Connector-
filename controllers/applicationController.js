// controllers/applicationController.js
// Handles applying to jobs (Job Seeker), viewing your own application
// history (Job Seeker), viewing applicants for a job you posted
// (Recruiter), and updating an application's status (Recruiter, and only
// for jobs THEY own - enforced by checking job.recruiter === req.user._id).

const Application = require('../models/Application');
const Job = require('../models/Job');

// @route  POST /api/applications/:jobId
// @access Private (Job Seeker only)
const applyToJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Duplicate check happens both here (friendly message) AND at the DB level
    // via the unique composite index on (job, applicant) as a safety net.
    const existing = await Application.findOne({ job: jobId, applicant: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    const application = await Application.create({
      job: jobId,
      applicant: req.user._id,
      status: 'Applied'
    });

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (err) {
    // 11000 = MongoDB duplicate key error - catches race conditions the findOne check above might miss
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error submitting application' });
  }
};

// @route  GET /api/applications/my
// @access Private (Job Seeker only) - the logged-in seeker's application history
const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate({
        path: 'job',
        select: 'title location job_type salary_range recruiter',
        populate: { path: 'recruiter', select: 'name companyName' }
      })
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching your applications' });
  }
};

// @route  GET /api/applications/job/:jobId
// @access Private (Recruiter only, and only if they own the job)
const getApplicantsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Owner-only check: a recruiter can only view applicants for THEIR OWN job postings
    if (job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only view applicants for jobs you posted' });
    }

    const applications = await Application.find({ job: jobId })
      .populate('applicant', 'name email')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching applicants' });
  }
};

// @route  PUT /api/applications/:id/status
// @access Private (Recruiter only, and only if they own the underlying job)
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Applied', 'Shortlisted', 'Rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const application = await Application.findById(req.params.id).populate('job');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Owner-only check: only the recruiter who posted the job can change its application statuses
    if (application.job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update applications for jobs you posted' });
    }

    application.status = status;
    await application.save();

    res.json({ message: 'Application status updated', application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating application status' });
  }
};

module.exports = { applyToJob, getMyApplications, getApplicantsForJob, updateApplicationStatus };
