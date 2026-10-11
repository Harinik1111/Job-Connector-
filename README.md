# JobConnect – Full Stack Job Portal

A beginner-friendly full-stack job portal built with **Node.js + Express**, **MongoDB (Mongoose)**, and **vanilla HTML/CSS/JS**.

## Project Structure

```
jobconnect/
├── package.json
├── .env
├── server.js
├── config/
│   └── db.js                  # MongoDB connection
├── models/
│   ├── User.js                # user_id, name, email, hashed password, role
│   ├── Profile.js             # qualification, experience, skills, resume_url
│   ├── Skill.js                # normalized skills master list
│   ├── Job.js                  # job postings + skills mapping
│   └── Application.js          # applications + composite unique index
├── middleware/
│   └── auth.js                # JWT verification + role-based access control
├── controllers/
│   ├── authController.js
│   ├── profileController.js
│   ├── jobController.js
│   └── applicationController.js
├── routes/
│   ├── authRoutes.js
│   ├── profileRoutes.js
│   ├── jobRoutes.js
│   └── applicationRoutes.js
└── public/                    # frontend (plain HTML/CSS/JS)
    ├── index.html              # Login / Register (role selector)
    ├── seeker-dashboard.html   # Job Seeker Dashboard
    ├── recruiter-dashboard.html# Recruiter Dashboard
    ├── css/style.css
    └── js/
        ├── auth.js
        ├── seeker.js
        └── recruiter.js
```

## 1. Prerequisites

- **Node.js** (v18+) installed
- **MongoDB Community Server** installed and running locally (this gives you `mongodb://localhost:27017`)
- **MongoDB Compass** installed (GUI to view your database)

## 2. Setup & Run

```bash
# 1. Navigate into the project folder
cd jobconnect

# 2. Install dependencies
npm install

# 3. Make sure MongoDB is running locally (mongod), then start the server
npm start
# or, for auto-restart on file changes during development:
npm run dev
```

The server will print:
```
MongoDB connected: localhost/jobconnect
JobConnect server running on http://localhost:5000
```

Open your browser at **http://localhost:5000** — you'll land on the Login/Register page.

## 3. How to Use

1. **Register** as either a *Job Seeker* or a *Recruiter* (pick the role from the dropdown).
2. **Recruiter flow:** Log in → "Post a Job" tab → fill in title/description/location/type/skills → Post. Then go to "My Posted Jobs" → "View Applicants" to see who applied and change their status via the dropdown (Applied / Shortlisted / Rejected).
3. **Job Seeker flow:** Log in → "Search Jobs" tab → filter by title/location/type/skill → click "Apply Now". Check "My Applications" tab to see your status update live once a recruiter changes it. Fill in "My Profile" tab to save your qualification/experience/skills/resume link.

## 4. MongoDB Compass Connection Guide

1. Open **MongoDB Compass**.
2. In the connection field at the top, paste this connection string (same one used in `.env`):
   ```
   mongodb://localhost:27017/jobconnect
   ```
3. Click **Connect**.
4. In the left sidebar, click the **`jobconnect`** database. You should see these collections appear automatically once you've registered a user / posted a job / applied, etc.:
   - `users`
   - `profiles`
   - `skills`
   - `jobs`
   - `applications`
5. Click into the **`applications`** collection → **Indexes** tab. You'll see the composite unique index on `{ job: 1, applicant: 1 }` — this is what stops the same job seeker applying to the same job twice at the database level.
6. You can browse/edit documents directly in Compass's **Documents** tab while testing — handy for confirming password hashes look scrambled (never plain text) and that `role` values are correct.

## 5. Security Notes (already implemented)

- Passwords are hashed with **bcrypt** before saving (`User.js` pre-save hook) — never stored in plain text.
- Auth uses **JWT** tokens (7-day expiry), sent as `Authorization: Bearer <token>` from the frontend.
- **Recruiter-only** middleware (`authorize('Recruiter')`) protects job creation and applicant management routes.
- **Owner-only** checks in `applicationController.js` ensure a recruiter can only view/update applications for jobs *they* posted (compares `job.recruiter` to the logged-in user's ID).
- The `(job, applicant)` **composite unique index** on the `Application` model prevents duplicate applications, both via an app-level check and a DB-level constraint (belt and suspenders).
- Job `title`/`description` are validated as non-empty both in the Mongoose schema and in the controller.

## 6. Quick API Reference

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | /api/auth/register | Public | Register (Job Seeker or Recruiter) |
| POST | /api/auth/login | Public | Login, returns JWT |
| GET | /api/auth/company-profile | Recruiter | Get own company profile |
| PUT | /api/auth/company-profile | Recruiter | Create/update company profile |
| GET | /api/profile/me | Job Seeker | Get own profile (incl. phone) |
| POST | /api/profile | Job Seeker | Create/update own profile |
| POST | /api/jobs | Recruiter | Post a new job |
| GET | /api/jobs?title=&location=&job_type=&skill=&experience= | Any logged-in user | Search/filter jobs |
| GET | /api/jobs/my | Recruiter | List jobs you posted |
| GET | /api/jobs/:id | Any logged-in user | Get one job's details |
| POST | /api/applications/:jobId | Job Seeker | Apply to a job |
| GET | /api/applications/my | Job Seeker | Your application history |
| GET | /api/applications/job/:jobId | Recruiter (owner only) | View applicants for your job |
| PUT | /api/applications/:id/status | Recruiter (owner only) | Update an applicant's status |

Enjoy building on top of this! Good next steps once you're comfortable: add pagination to job search, email notifications on status change, and real resume file uploads (e.g. with `multer`).
