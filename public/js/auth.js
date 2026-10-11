// public/js/auth.js
// Handles the login/register page: tab switching, form submission,
// storing the JWT + user info in localStorage, and redirecting to the
// correct dashboard based on role.

const API_BASE = '/api';

// If already logged in, skip straight to the right dashboard
(function redirectIfLoggedIn() {
  const user = JSON.parse(localStorage.getItem('jc_user') || 'null');
  if (user) {
    window.location.href = user.role === 'Recruiter' ? '/recruiter-dashboard.html' : '/seeker-dashboard.html';
  }
})();

const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const errorMsg = document.getElementById('errorMsg');
const successMsg = document.getElementById('successMsg');
const registerRole = document.getElementById('registerRole');
const companyField = document.getElementById('companyField');

function switchTab(tab) {
  hideMessages();
  if (tab === 'login') {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  } else {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

function hideMessages() {
  errorMsg.style.display = 'none';
  successMsg.style.display = 'none';
}

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.style.display = 'block';
  successMsg.style.display = 'none';
}

function showSuccess(message) {
  successMsg.textContent = message;
  successMsg.style.display = 'block';
  errorMsg.style.display = 'none';
}

// Show/hide the "Company Name" field depending on selected role
registerRole.addEventListener('change', () => {
  companyField.classList.toggle('hidden', registerRole.value !== 'Recruiter');
});

// Handle Login submit
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessages();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      showError(data.message || 'Login failed');
      return;
    }

    localStorage.setItem('jc_token', data.token);
    localStorage.setItem('jc_user', JSON.stringify(data.user));

    window.location.href = data.user.role === 'Recruiter' ? '/recruiter-dashboard.html' : '/seeker-dashboard.html';
  } catch (err) {
    showError('Could not connect to the server. Is it running?');
  }
});

// Handle Register submit
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessages();

  const payload = {
    role: registerRole.value,
    name: document.getElementById('registerName').value.trim(),
    email: document.getElementById('registerEmail').value.trim(),
    password: document.getElementById('registerPassword').value,
    companyName: document.getElementById('registerCompany').value.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      showError(data.message || 'Registration failed');
      return;
    }

    localStorage.setItem('jc_token', data.token);
    localStorage.setItem('jc_user', JSON.stringify(data.user));

    showSuccess('Account created! Redirecting...');
    setTimeout(() => {
      window.location.href = data.user.role === 'Recruiter' ? '/recruiter-dashboard.html' : '/seeker-dashboard.html';
    }, 700);
  } catch (err) {
    showError('Could not connect to the server. Is it running?');
  }
});
