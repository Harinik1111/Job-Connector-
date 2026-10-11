// controllers/jobController.js
// Handles job posting (Recruiter only) and job searching/filtering (any
// logged-in user). Skills are resolved the same find-or-create way as in
// profileController so Jobs and Profiles share the same normalized Skill list.

const Job = require('../models/Job');
const Skill = require('../models/Skill');

const resolveSkillIds = async (skillNames = []) => {
  const cleanNames = [...new Set(skillNames.map((s) => s.trim().toLowerCase()).filter(Boolean))];
  const skillIds = [];
  for (const name of cleanNames) {
    let skill = await Skill.findOne({ name });
    if (!skill) skill = await Skill.create({ name });
    skillIds.push(skill._id);
  }
  return skillIds;
};

// @route  POST /api/jobs
// @access Private (Recruiter only)
const createJob = async (req, res) => {
  try {
    const { title, description, location, job_type, experience_required, salary_range, skills } = req.body;

    // Non-empty title/description validation (defense in depth - schema also validates this)
    if (!title || !title.trim() || !description || !description.trim()) {
      return res.status(400).json({ message: 'Title and description cannot be empty' });
    }
    if (!location || !job_type) {
      return res.status(400).json({ message: 'Location and job type are required' });
    }

    const skillIds = await resolveSkillIds(skills || []);

    const job = await Job.create({
      recruiter: req.user._id, // taken from the logged-in user, never trusted from the client
      title: title.trim(),
      description: description.trim(),
      location,
      job_type,
      experience_required: experience_required || 0,
      salary_range: salary_range || 'Not disclosed',
      skills: skillIds
    });

    const populatedJob = await job.populate('skills', 'name');
    res.status(201).json({ message: 'Job posted successfully', job: populatedJob });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error posting job' });
  }
};

// @route  GET /api/jobs
// @query  title, location, job_type, skill, experience (search & filter, all optional, combinable)
// @access Private (any logged-in user)
const getJobs = async (req, res) => {
  try {
    const { title, location, job_type, skill, experience } = req.query;
    const filter = {};

    if (title) {
      filter.title = { $regex: title, $options: 'i' }; // case-insensitive partial match
    }
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    if (job_type) {
      filter.job_type = job_type;
    }
    if (skill) {
      const skillDoc = await Skill.findOne({ name: skill.trim().toLowerCase() });
      // If the skill doesn't exist at all, return no jobs rather than erroring
      filter.skills = skillDoc ? skillDoc._id : null;
    }
    if (experience !== undefined && experience !== '') {
      // Interpreted as "jobs I qualify for": show postings whose required
      // experience is at or below what the seeker enters as their own experience.
      const expNum = Number(experience);
      if (!Number.isNaN(expNum)) {
        filter.experience_required = { $lte: expNum };
      }
    }

    const jobs = await Job.find(filter)
      .populate('recruiter', 'name companyName email')
      .populate('skills', 'name')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching jobs' });
  }
};

// @route  GET /api/jobs/my
// @access Private (Recruiter only) - jobs posted by the logged-in recruiter
const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.user._id })
      .populate('skills', 'name')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching your jobs' });
  }
};

// @route  GET /api/jobs/:id
// @access Private
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('recruiter', 'name companyName email')
      .populate('skills', 'name');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching job' });
  }
};

module.exports = { createJob, getJobs, getMyJobs, getJobById };
