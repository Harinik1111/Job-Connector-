// public/js/recruiter.js
// Powers the Recruiter Dashboard: post jobs, list posted jobs, view
// applicants for a job, and update each applicant's status via dropdown.

const API_BASE = '/api';
const token = localStorage.getItem('jc_token');
const user = JSON.parse(localStorage.getItem('jc_user') || 'null');

// Guard: must be logged in as a Recruiter to view this page
if (!token || !user || user.role !== 'Recruiter') {
  window.location.href = '/index.html';
}

document.getElementById('welcomeText').textContent = `Hi, ${user.name} (Recruiter)`;

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
  document.getElementById('postTab').classList.toggle('hidden', tab !== 'post');
  document.getElementById('myJobsTab').classList.toggle('hidden', tab !== 'myjobs');
  document.getElementById('companyTab').classList.toggle('hidden', tab !== 'company');

  document.getElementById('tabPostBtn').classList.toggle('active', tab === 'post');
  document.getElementById('tabMyJobsBtn').classList.toggle('active', tab === 'myjobs');
  document.getElementById('tabCompanyBtn').classList.toggle('active', tab === 'company');

  if (tab === 'myjobs') loadMyJobs();
  if (tab === 'company') loadCompanyProfile();
}

// ---------- Company Profile ----------
async function loadCompanyProfile() {
  const res = await fetch(`${API_BASE}/auth/company-profile`, { headers: authHeaders() });
  if (!res.ok) return;
  const data = await res.json();

  document.getElementById('companyName').value = data.companyName || '';
  document.getElementById('companyDescription').value = data.companyDescription || '';
  document.getElementById('companyWebsite').value = data.companyWebsite || '';
  document.getElementById('companyLocation').value = data.companyLocation || '';
}

document.getElementById('companyForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const companySuccess = document.getElementById('companySuccess');
  const companyError = document.getElementById('companyError');
  companySuccess.style.display = 'none';
  companyError.style.display = 'none';

  const payload = {
    companyName: document.getElementById('companyName').value.trim(),
    companyDescription: document.getElementById('companyDescription').value.trim(),
    companyWebsite: document.getElementById('companyWebsite').value.trim(),
    companyLocation: document.getElementById('companyLocation').value.trim()
  };

  const res = await fetch(`${API_BASE}/auth/company-profile`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();

  if (!res.ok) {
    companyError.textContent = data.message || 'Could not save company profile';
    companyError.style.display = 'block';
    return;
  }

  companySuccess.textContent = 'Company profile saved!';
  companySuccess.style.display = 'block';

  // Keep localStorage in sync so job postings immediately reflect the new company name
  const storedUser = JSON.parse(localStorage.getItem('jc_user') || '{}');
  storedUser.companyName = data.companyName;
  localStorage.setItem('jc_user', JSON.stringify(storedUser));
});

// ---------- Post a Job ----------
document.getElementById('jobForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const postSuccess = document.getElementById('postSuccess');
  const postError = document.getElementById('postError');
  postSuccess.style.display = 'none';
  postError.style.display = 'none';

  const skills = document.getElementById('jobSkills').value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const payload = {
    title: document.getElementById('jobTitle').value.trim(),
    description: document.getElementById('jobDescription').value.trim(),
    location: document.getElementById('jobLocation').value.trim(),
    job_type: document.getElementById('jobType').value,
    experience_required: Number(document.getElementById('jobExperience').value) || 0,
    salary_range: document.getElementById('jobSalary').value.trim() || 'Not disclosed',
    skills
  };

  try {
    const res = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      postError.textContent = data.message || 'Could not post job';
      postError.style.display = 'block';
      return;
    }

    postSuccess.textContent = 'Job posted successfully!';
    postSuccess.style.display = 'block';
    document.getElementById('jobForm').reset();
  } catch (err) {
    postError.textContent = 'Server error - please try again';
    postError.style.display = 'block';
  }
});

// ---------- My Posted Jobs ----------
async function loadMyJobs() {
  const res = await fetch(`${API_BASE}/jobs/my`, { headers: authHeaders() });
  const jobs = await res.json();

  const container = document.getElementById('myJobsList');
  container.innerHTML = '';
  document.getElementById('applicantsPanel').classList.add('hidden');

  if (!Array.isArray(jobs) || jobs.length === 0) {
    container.innerHTML = '<div class="card"><div class="empty-state">You haven\'t posted any jobs yet.</div></div>';
    return;
  }

  jobs.forEach((job) => {
    const skillTags = (job.skills || []).map((s) => `<span class="skill-tag">${s.name}</span>`).join('');
    const card = document.createElement('div');
    card.className = 'card job-card';
    card.innerHTML = `
      <h3>${job.title}</h3>
      <div class="job-meta">
        <span>📍 ${job.location}</span>
        <span>💼 ${job.job_type}</span>
        <span>⏳ ${job.experience_required}+ yrs</span>
        <span>💰 ${job.salary_range}</span>
      </div>
      <p>${job.description}</p>
      <div>${skillTags}</div>
      <br/>
      <button class="btn btn-primary btn-small" onclick="viewApplicants('${job._id}', '${job.title.replace(/'/g, "\\'")}')">
        View Applicants
      </button>
    `;
    container.appendChild(card);
  });
}

// ---------- Applicant Manager ----------
async function viewApplicants(jobId, jobTitle) {
  const res = await fetch(`${API_BASE}/applications/job/${jobId}`, { headers: authHeaders() });
  const applicants = await res.json();

  const panel = document.getElementById('applicantsPanel');
  const tbody = document.getElementById('applicantsTableBody');
  const emptyState = document.getElementById('applicantsEmpty');

  document.getElementById('applicantsJobTitle').textContent = `Applicants for: ${jobTitle}`;
  tbody.innerHTML = '';
  panel.classList.remove('hidden');
  panel.scrollIntoView({ behavior: 'smooth' });

  if (!res.ok) {
    alert(applicants.message || 'Could not load applicants');
    return;
  }

  if (!Array.isArray(applicants) || applicants.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  applicants.forEach((app) => {
    const applicant = app.applicant || {};
    const appliedDate = new Date(app.applied_date || app.createdAt).toLocaleDateString();

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${applicant.name || '(deleted user)'}</td>
      <td>${applicant.email || '-'}</td>
      <td>${appliedDate}</td>
      <td>
        <select onchange="updateStatus('${app._id}', this.value)">
          <option value="Applied" ${app.status === 'Applied' ? 'selected' : ''}>Applied</option>
          <option value="Shortlisted" ${app.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
          <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function updateStatus(applicationId, newStatus) {
  const res = await fetch(`${API_BASE}/applications/${applicationId}/status`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ status: newStatus })
  });
  const data = await res.json();

  if (!res.ok) {
    alert(data.message || 'Could not update status');
  }
}

function closeApplicantsPanel() {
  document.getElementById('applicantsPanel').classList.add('hidden');
}
