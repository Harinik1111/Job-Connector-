// seed.js
// Populates the database with realistic dummy data so you have something
// to click around with immediately, instead of registering everything by hand.
//
// Run with:   npm run seed
//
// WARNING: this WIPES the users, profiles, skills, jobs, and applications
// collections before inserting fresh data. Don't run this against real data.

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const User = require('./models/User');
const Profile = require('./models/Profile');
const Skill = require('./models/Skill');
const Job = require('./models/Job');
const Application = require('./models/Application');

const SKILL_NAMES = [
  'javascript', 'react', 'node.js', 'mongodb', 'python',
  'django', 'sql', 'aws', 'docker', 'java',
  'html', 'css', 'typescript', 'express', 'git'
];

const seed = async () => {
  try {
    await connectDB();
    console.log('Connected. Clearing old data...');

    await Promise.all([
      User.deleteMany({}),
      Profile.deleteMany({}),
      Skill.deleteMany({}),
      Job.deleteMany({}),
      Application.deleteMany({})
    ]);

    // ---------- 1. Skills (master list) ----------
    const skillDocs = await Skill.insertMany(SKILL_NAMES.map((name) => ({ name })));
    const skillMap = {}; // name -> _id, for easy lookup below
    skillDocs.forEach((s) => (skillMap[s.name] = s._id));
    console.log(`Created ${skillDocs.length} skills.`);

    // ---------- 2. Users ----------
    // Note: passwords are plain text here on purpose - the User model's
    // pre-save hook hashes them automatically with bcrypt when .create() runs.
    const recruiters = await User.create([
      {
        name: 'Anita Sharma',
        email: 'recruiter1@jobconnect.com',
        password: 'password123',
        role: 'Recruiter',
        companyName: 'TechNova Solutions',
        companyDescription: 'A product company building web and cloud tools for small businesses.',
        companyWebsite: 'https://technova.example.com',
        companyLocation: 'Bangalore, India'
      },
      {
        name: 'Rahul Mehta',
        email: 'recruiter2@jobconnect.com',
        password: 'password123',
        role: 'Recruiter',
        companyName: 'BrightPath Analytics',
        companyDescription: 'A data and analytics consultancy serving fintech clients.',
        companyWebsite: 'https://brightpath.example.com',
        companyLocation: 'Hyderabad, India'
      }
    ]);

    const seekers = await User.create([
      {
        name: 'Priya Nair',
        email: 'seeker1@jobconnect.com',
        password: 'password123',
        role: 'Job Seeker'
      },
      {
        name: 'Arjun Verma',
        email: 'seeker2@jobconnect.com',
        password: 'password123',
        role: 'Job Seeker'
      },
      {
        name: 'Sneha Kapoor',
        email: 'seeker3@jobconnect.com',
        password: 'password123',
        role: 'Job Seeker'
      }
    ]);
    console.log(`Created ${recruiters.length} recruiters and ${seekers.length} job seekers.`);

    const [technova, brightpath] = recruiters;
    const [priya, arjun, sneha] = seekers;

    // ---------- 3. Profiles (for job seekers) ----------
    await Profile.create([
      {
        user: priya._id,
        phone: '9876543210',
        qualification: 'B.Tech in Computer Science',
        experience: 2,
        skills: [skillMap['javascript'], skillMap['react'], skillMap['css'], skillMap['html']],
        resume_url: 'https://example.com/resumes/priya-nair.pdf'
      },
      {
        user: arjun._id,
        phone: '9876543211',
        qualification: 'M.Sc in Data Science',
        experience: 4,
        skills: [skillMap['python'], skillMap['django'], skillMap['sql'], skillMap['aws']],
        resume_url: 'https://example.com/resumes/arjun-verma.pdf'
      },
      {
        user: sneha._id,
        phone: '9876543212',
        qualification: 'B.E in Information Technology',
        experience: 1,
        skills: [skillMap['node.js'], skillMap['express'], skillMap['mongodb'], skillMap['git']],
        resume_url: 'https://example.com/resumes/sneha-kapoor.pdf'
      }
    ]);
    console.log('Created 3 profiles.');

    // ---------- 4. Jobs ----------
    const jobs = await Job.create([
      {
        recruiter: technova._id,
        title: 'Frontend Developer (React)',
        description: 'Build and maintain customer-facing web apps using React and modern JavaScript. Work closely with designers to ship polished UI.',
        location: 'Bangalore',
        job_type: 'Full-time',
        experience_required: 1,
        salary_range: '6-10 LPA',
        skills: [skillMap['javascript'], skillMap['react'], skillMap['css'], skillMap['html']]
      },
      {
        recruiter: technova._id,
        title: 'Backend Engineer (Node.js)',
        description: 'Design and build REST APIs powering our core product using Node.js, Express, and MongoDB. Own services end to end.',
        location: 'Bangalore',
        job_type: 'Full-time',
        experience_required: 2,
        salary_range: '8-14 LPA',
        skills: [skillMap['node.js'], skillMap['express'], skillMap['mongodb'], skillMap['javascript']]
      },
      {
        recruiter: technova._id,
        title: 'DevOps Intern',
        description: 'Assist the platform team with CI/CD pipelines, containerization, and cloud infrastructure on AWS.',
        location: 'Remote',
        job_type: 'Internship',
        experience_required: 0,
        salary_range: '20k/month stipend',
        skills: [skillMap['docker'], skillMap['aws'], skillMap['git']]
      },
      {
        recruiter: brightpath._id,
        title: 'Data Analyst',
        description: 'Analyze large datasets to generate business insights. Write efficient SQL queries and build Python data pipelines.',
        location: 'Hyderabad',
        job_type: 'Full-time',
        experience_required: 2,
        salary_range: '7-12 LPA',
        skills: [skillMap['python'], skillMap['sql'], skillMap['django']]
      },
      {
        recruiter: brightpath._id,
        title: 'Full Stack Developer',
        description: 'Work across the stack - React frontend, Node.js/Express backend, MongoDB database. Ideal for someone who likes owning features end to end.',
        location: 'Pune',
        job_type: 'Full-time',
        experience_required: 3,
        salary_range: '12-18 LPA',
        skills: [skillMap['react'], skillMap['node.js'], skillMap['mongodb'], skillMap['typescript']]
      },
      {
        recruiter: brightpath._id,
        title: 'Freelance Java Developer',
        description: 'Short-term contract to build a Java-based microservice for internal tooling. 3-month engagement.',
        location: 'Remote',
        job_type: 'Contract',
        experience_required: 3,
        salary_range: '₹800/hr',
        skills: [skillMap['java'], skillMap['sql']]
      }
    ]);
    console.log(`Created ${jobs.length} jobs.`);

    const [frontendJob, backendJob, devopsJob, dataJob, fullstackJob] = jobs;

    // ---------- 5. Applications ----------
    await Application.create([
      { job: frontendJob._id, applicant: priya._id, status: 'Shortlisted' },
      { job: fullstackJob._id, applicant: priya._id, status: 'Applied' },
      { job: dataJob._id, applicant: arjun._id, status: 'Applied' },
      { job: backendJob._id, applicant: sneha._id, status: 'Rejected' },
      { job: fullstackJob._id, applicant: sneha._id, status: 'Shortlisted' },
      { job: devopsJob._id, applicant: arjun._id, status: 'Applied' }
    ]);
    console.log('Created 6 applications.');

    console.log('\n================ SEED COMPLETE ================');
    console.log('You can log in with any of these accounts (password for all: password123)\n');
    console.log('RECRUITERS:');
    console.log('  recruiter1@jobconnect.com  (Anita Sharma - TechNova Solutions)');
    console.log('  recruiter2@jobconnect.com  (Rahul Mehta - BrightPath Analytics)');
    console.log('\nJOB SEEKERS:');
    console.log('  seeker1@jobconnect.com     (Priya Nair)');
    console.log('  seeker2@jobconnect.com     (Arjun Verma)');
    console.log('  seeker3@jobconnect.com     (Sneha Kapoor)');
    console.log('=================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
