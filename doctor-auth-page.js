const API_BASE_URL = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : 'http://127.0.0.1:8001';
const params = new URLSearchParams(window.location.search);
const nextPage = params.get('next') || 'doctor_dashboard.html';
const noticeEl = document.getElementById('notice');
let authRequestInFlight = false;

function getSubmitButton(path) {
    if (path.includes('/doctor/login')) return document.getElementById('loginSubmitBtn');
    if (path.includes('/doctor/signup')) return document.getElementById('signupSubmitBtn');
    return document.getElementById('adminSubmitBtn');
}

function setSubmitButtonState(button, isBusy, idleLabel) {
    if (!button) return;
    button.disabled = isBusy;
    button.textContent = isBusy ? 'Please wait...' : idleLabel;
    button.style.opacity = isBusy ? '0.75' : '1';
    button.style.cursor = isBusy ? 'wait' : 'pointer';
}

function getApiBaseCandidates() {
    const bases = [];
    const currentProtocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const currentHost = window.location.hostname || 'localhost';
    const looksLocalHost = currentHost === 'localhost' || currentHost === '127.0.0.1';

    if (typeof API_BASE_URL === 'string' && API_BASE_URL.trim()) {
        bases.push(API_BASE_URL.trim());
    }

    if (typeof CONFIG !== 'undefined' && Array.isArray(CONFIG.LOCAL_API_BASE_URLS)) {
        CONFIG.LOCAL_API_BASE_URLS.forEach((url) => {
            const normalizedUrl = typeof url === 'string' ? url.trim() : '';
            if (normalizedUrl) {
                bases.push(normalizedUrl);
            }
        });
    }

    if (looksLocalHost) {
        // Prefer same host as frontend to avoid localhost/127 mismatch issues.
        bases.push(`${currentProtocol}//${currentHost}:8001`);
        bases.push(`${currentProtocol}//${currentHost}:8011`);
    }

    if (!bases.length) {
        bases.push('http://localhost:8001', 'http://127.0.0.1:8001');
    }

    // Never try frontend static server port as API backend.
    return [...new Set(
        bases
            .map((url) => String(url || '').replace(/\/$/, ''))
            .filter((url) => /:\d+$/.test(url) && !url.endsWith(':8000'))
    )];
}

function buildAuthUrl(base, path) {
    return base ? `${base}${path}` : path;
}

async function fetchWithTimeout(url, options, timeoutMs = 7000) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        window.clearTimeout(timeoutId);
    }
}

function showNotice(type, message) {
    noticeEl.className = `notice show ${type}`;
    noticeEl.textContent = message;
    noticeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function setActiveTab(tab) {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });
    document.getElementById('loginCard').classList.toggle('active', tab === 'login');
    document.getElementById('signupCard').classList.toggle('active', tab === 'signup');
    document.getElementById('adminCard').classList.toggle('active', tab === 'admin');
    noticeEl.className = 'notice';
    noticeEl.textContent = '';
}

function storeAuth(data, email) {
    const normalizedRole = String(data.role || 'doctor').toLowerCase();
    const accessToken = String(data.access_token || '');
    localStorage.setItem('authToken', data.access_token);
    localStorage.setItem('authTokenType', data.token_type || 'bearer');
    localStorage.setItem('authRole', normalizedRole);
    sessionStorage.setItem('authRole', normalizedRole);
    sessionStorage.setItem('role', normalizedRole);
    sessionStorage.setItem('token', accessToken);
    localStorage.setItem('clientEmail', email);
    if (typeof window.markDoctorAdminSessionActive === 'function') {
        window.markDoctorAdminSessionActive();
    } else {
        sessionStorage.setItem('doctorAdminSessionActive', '1');
    }
}

function candidatePaths(path) {
    if (String(path).startsWith('/api/')) {
        return [path, path.replace(/^\/api/, '')];
    }
    return [path, `/api${path}`];
}

async function submitDoctorAuth(path, payload, successMessage) {
    if (authRequestInFlight) {
        return;
    }
    authRequestInFlight = true;
    const submitButton = getSubmitButton(path);
    const idleLabel = submitButton ? submitButton.textContent : '';
    setSubmitButtonState(submitButton, true, idleLabel);
    showNotice('info', 'Submitting...');

    try {
        let lastErrorMessage = 'Authentication failed.';
        const pathCandidates = candidatePaths(path);
        const baseCandidates = getApiBaseCandidates();

        for (const base of baseCandidates) {
            for (const candidate of pathCandidates) {
                try {
                    const response = await fetchWithTimeout(buildAuthUrl(base, candidate), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    }, 7000);

                    const data = await response.json().catch(() => ({}));
                    if (response.ok && data.access_token) {
                        storeAuth(data, payload.email);
                        showNotice('success', successMessage);
                        setTimeout(() => {
                            window.location.href = nextPage;
                        }, 400);
                        return;
                    }

                    if (response.status !== 404) {
                        lastErrorMessage = data.detail || 'Authentication failed.';
                        break;
                    }

                    lastErrorMessage = data.detail || 'Authentication failed.';
                } catch (error) {
                    lastErrorMessage = error.name === 'AbortError'
                        ? 'Request timed out while connecting to the login service.'
                        : `Unable to connect: ${error.message}`;
                }
            }
        }

        showNotice('error', lastErrorMessage);
    } catch (error) {
        const message = `Unable to connect: ${error.message}`;
        showNotice('error', message);
    } finally {
        setSubmitButtonState(submitButton, false, idleLabel);
        authRequestInFlight = false;
    }
}

document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => setActiveTab(btn.getAttribute('data-tab')));
});

async function handleDoctorLogin(event) {
    if (event) event.preventDefault();
    const form = document.getElementById('loginForm');
    if (form && !form.reportValidity()) return;
    await submitDoctorAuth('/doctor/login', {
        email: document.getElementById('loginEmail').value.trim(),
        password: document.getElementById('loginPassword').value,
    }, 'Login successful. Redirecting to dashboard...');
}

async function handleDoctorSignup(event) {
    if (event) event.preventDefault();
    const form = document.getElementById('signupForm');
    if (form && !form.reportValidity()) return;
    await submitDoctorAuth('/doctor/signup', {
        full_name: document.getElementById('signupName').value.trim(),
        email: document.getElementById('signupEmail').value.trim(),
        password: document.getElementById('signupPassword').value,
    }, 'Doctor account created. Redirecting to dashboard...');
}

async function handleAdminLogin(event) {
    if (event) event.preventDefault();
    const form = document.getElementById('adminForm');
    if (form && !form.reportValidity()) return;
    await submitDoctorAuth('/admin/login', {
        email: document.getElementById('adminEmail').value.trim(),
        password: document.getElementById('adminPassword').value,
    }, 'Admin login successful. Redirecting...');
}

document.getElementById('loginForm').addEventListener('submit', handleDoctorLogin);
document.getElementById('signupForm').addEventListener('submit', handleDoctorSignup);
document.getElementById('adminForm').addEventListener('submit', handleAdminLogin);
document.getElementById('loginSubmitBtn').addEventListener('click', handleDoctorLogin);
document.getElementById('signupSubmitBtn').addEventListener('click', handleDoctorSignup);
document.getElementById('adminSubmitBtn').addEventListener('click', handleAdminLogin);

if (
    typeof window.isAuthenticated === 'function' &&
    window.isAuthenticated() &&
    typeof window.isDoctorAdminSessionActive === 'function' &&
    window.isDoctorAdminSessionActive()
) {
    const role = typeof window.getCurrentAuthRole === 'function' ? window.getCurrentAuthRole() : null;
    if (role === 'doctor' || role === 'admin') {
        window.location.href = nextPage;
    }
}
