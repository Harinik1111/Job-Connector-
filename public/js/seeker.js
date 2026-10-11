// public/js/seeker.js
// Powers the Job Seeker Dashboard: search/filter jobs, apply to jobs,
// view application history, and edit profile. All requests attach the
// JWT stored in localStorage via the Authorization header.

const API_BASE = '/api';
const token = localStorage.getItem('jc_token');
const user = JSON.parse(localStorage.getItem('jc_user') || 'null');

// Guard: must be logged in as a Job Seeker to view this page
if (!token || !user || user.role !== 'Job Seeker') {
  window.location.href = '/index.html';
}

document.getElementById('welcomeText').textContent = `Hi, ${user.name} (Job Seeker)`;

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function logout() {
  localStorage.removeItem('jc_token');
  localStorage.removeItem('jc_user');
  window.location.href = '/index.html';
}

// ---------- Dashboard tab switching ----------
function switchDashTab(tab) {
  document.getElementById('jobsTab').classList.toggle('hidden', tab !== 'jobs');
  document.getElementById('appsTab').classList.toggle('hidden', tab !== 'apps');
  document.getElementById('profileTab').classList.toggle('hidden', tab !== 'profile');

  document.getElementById('tabJobsBtn').classList.toggle('active', tab === 'jobs');
  document.getElementById('tabAppsBtn').classList.toggle('active', tab === 'apps');
  document.getElementById('tabProfileBtn').classList.toggle('active', tab === 'profile');

  if (tab === 'jobs') loadJobs();
  if (tab === 'apps') loadMyApplications();
  if (tab === 'profile') loadMyProfile();
}

// ---------- Search / Filter / List Jobs ----------
async function loadJobs() {
  const title = document.getElementById('filterTitle').value.trim();
  const location = document.getElementById('filterLocation').value.trim();
  const job_type = document.getElementById('filterType').value;
  const skill = document.getElementById('filterSkill').value.trim();
  const experience = document.getElementById('filterExperience').value;

  const params = new URLSearchParams();
  if (title) params.append('title', title);
  if (location) params.append('location', location);
  if (job_type) params.append('job_type', job_type);
  if (skill) params.append('skill', skill);
  if (experience !== '') params.append('experience', experience);

  const res = await fetch(`${API_BASE}/jobs?${params.toString()}`, { headers: authHeaders() });
  const jobs = await res.json();

  // Also fetch my applications so we know which jobs are already applied to
  const appsRes = await fetch(`${API_BASE}/applications/my`, { headers: authHeaders() });
  const myApps = appsRes.ok ? await appsRes.json() : [];
  const appliedJobIds = new Set(myApps.map((a) => a.job && a.job._id));

  const container = document.getElementById('jobsList');
  container.innerHTML = '';

  if (!Array.isArray(jobs) || jobs.length === 0) {
    container.innerHTML = '<div class="card"><div class="empty-state">No jobs found matching your search.</div></div>';
    return;
  }

  jobs.forEach((job) => {
    const alreadyApplied = appliedJobIds.has(job._id);
    const skillTags = (job.skills || []).map((s) => `<span class="skill-tag">${s.name}</span>`).join('');

    const card = document.createElement('div');
    card.className = 'card job-card';
    card.innerHTML = `
      <h3>${job.title}</h3>
      <div class="job-meta">
        <span>🏢 ${job.recruiter?.companyName || job.recruiter?.name || 'Company'}</span>
        <span>📍 ${job.location}</span>
        <span>💼 ${job.job_type}</span>
        <span>⏳ ${job.experience_required}+ yrs</span>
        <span>💰 ${job.salary_range}</span>
      </div>
      <p>${job.description}</p>
      <div>${skillTags}</div>
      <br/>
      <button class="btn ${alreadyApplied ? 'btn-secondary' : 'btn-primary'} btn-small"
        ${alreadyApplied ? 'disabled' : ''}
        onclick="applyToJob('${job._id}', this)">
        ${alreadyApplied ? 'Already Applied' : 'Apply Now'}
      </button>
    `;
    container.appendChild(card);
  });
}

async function applyToJob(jobId, btnEl) {
  btnEl.disabled = true;
  btnEl.textContent = 'Applying...';

  try {
    const res = await fetch(`${API_BASE}/applications/${jobId}`, {
      method: 'POST',
      headers: authHeaders()
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Could not apply to this job');
      btnEl.disabled = false;
      btnEl.textContent = 'Apply Now';
      return;
    }

    btnEl.textContent = 'Already Applied';
    btnEl.classList.remove('btn-primary');
    btnEl.classList.add('btn-secondary');
  } catch (err) {
    alert('Server error - please try again');
    btnEl.disabled = false;
    btnEl.textContent = 'Apply Now';
  }
}

// ---------- Application History ----------
async function loadMyApplications() {
  const res = await fetch(`${API_BASE}/applications/my`, { headers: authHeaders() });
  const apps = await res.json();

  const tbody = document.getElementById('appsTableBody');
  const emptyState = document.getElementById('appsEmpty');
  tbody.innerHTML = '';

  if (!Array.isArray(apps) || apps.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  apps.forEach((app) => {
    const job = app.job || {};
    const company = job.recruiter?.companyName || job.recruiter?.name || '-';
    const appliedDate = new Date(app.applied_date || app.createdAt).toLocaleDateString();

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${job.title || '(deleted job)'}</td>
      <td>${company}</td>
      <td>${job.location || '-'}</td>
      <td>${appliedDate}</td>
      <td><span class="status-badge status-${app.status}">${app.status}</span></td>
    `;
    tbody.appendChild(row);
  });
}

// ---------- Profile ----------
async function loadMyProfile() {
  const res = await fetch(`${API_BASE}/profile/me`, { headers: authHeaders() });
  if (res.status === 404) return; // no profile yet - leave form blank
  const profile = await res.json();
  if (!profile) return;

  document.getElementById('profPhone').value = profile.phone || '';
  document.getElementById('profQualification').value = profile.qualification || '';
  document.getElementById('profExperience').value = profile.experience || 0;
  document.getElementById('profSkills').value = (profile.skills || []).map((s) => s.name).join(', ');
  document.getElementById('profResume').value = profile.resume_url || '';
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const skills = document.getElementById('profSkills').value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const payload = {
    phone: document.getElementById('profPhone').value.trim(),
    qualification: document.getElementById('profQualification').value.trim(),
    experience: Number(document.getElementById('profExperience').value) || 0,
    skills,
    resume_url: document.getElementById('profResume').value.trim()
  };

  const res = await fetch(`${API_BASE}/profile`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  const successMsg = document.getElementById('profileSuccess');

  if (res.ok) {
    successMsg.textContent = 'Profile saved successfully!';
    successMsg.style.display = 'block';
    setTimeout(() => (successMsg.style.display = 'none'), 2500);
  } else {
    alert(data.message || 'Could not save profile');
  }
});

// Initial load
loadJobs();
