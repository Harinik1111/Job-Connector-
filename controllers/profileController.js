// controllers/profileController.js
// Lets a Job Seeker create/update their profile (qualification, experience,
// skills, resume link). Skills are passed in as plain names (e.g. ["React",
// "Node.js"]) and we find-or-create matching Skill documents so the data
// stays normalized in the Skills collection.

const Profile = require('../models/Profile');
const Skill = require('../models/Skill');

// Converts an array of skill name strings into an array of Skill ObjectIds,
// creating any skill that doesn't already exist yet.
const resolveSkillIds = async (skillNames = []) => {
  const cleanNames = [...new Set(skillNames.map((s) => s.trim().toLowerCase()).filter(Boolean))];

  const skillIds = [];
  for (const name of cleanNames) {
    let skill = await Skill.findOne({ name });
    if (!skill) {
      skill = await Skill.create({ name });
    }
    skillIds.push(skill._id);
  }
  return skillIds;
};

// @route  GET /api/profile/me
// @access Private (Job Seeker)
const getMyProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id }).populate('skills', 'name');
    if (!profile) {
      return res.status(404).json({ message: 'No profile found yet - create one first' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// @route  POST /api/profile
// @access Private (Job Seeker only)
const upsertProfile = async (req, res) => {
  try {
    const { phone, qualification, experience, skills, resume_url } = req.body;

    const skillIds = await resolveSkillIds(skills || []);

    const profileData = {
      user: req.user._id,
      phone: phone || '',
      qualification: qualification || '',
      experience: experience || 0,
      skills: skillIds,
      resume_url: resume_url || ''
    };

    // Create if it doesn't exist, otherwise update (upsert = update or insert)
    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      profileData,
      { new: true, upsert: true, runValidators: true }
    ).populate('skills', 'name');

    res.json({ message: 'Profile saved', profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error saving profile' });
  }
};

module.exports = { getMyProfile, upsertProfile };
