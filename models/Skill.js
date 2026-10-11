// models/Skill.js
// A normalized master list of skills (e.g. "JavaScript", "React", "SQL").
// Jobs and Profiles reference these documents by ObjectId instead of
// re-typing free-text skill names everywhere - this is the Mongo
// equivalent of a "Skills" lookup table + join table (JobSkills).

const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Skill', skillSchema);
