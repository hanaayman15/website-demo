/**
 * Frontend Configuration
 * 
 * Centralizes all configuration settings for the frontend application.
 * This enables easy switching between development and production environments.
 */

const CONFIG = {
    /**
     * API Base URL
     * 
     * Dynamically determines the correct API endpoint:
     * - Development: http://127.0.0.1:8001 (local backend)
     * - Production: https://api.yourdomain.com (update for your domain)
     */
    API_BASE_URL: (() => {
        const host = window.location.hostname;
        const protocol = window.location.protocol;
        const isFileProtocol = protocol === 'file:';
        const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '';
        const isPrivateLanIp = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host);
        const isGithubPagesHost = host === 'hanaayman15.github.io' || host.endsWith('.github.io');

        // Optional explicit override (helpful for testing ngrok/Render quickly).
        const explicitOverride =
            (window.__API_BASE_URL__ && String(window.__API_BASE_URL__).trim()) ||
            (localStorage.getItem('apiBaseUrlOverride') || '').trim();
        if (explicitOverride) {
            return explicitOverride.replace(/\/$/, '');
        }

        // Local development (including opening HTML files directly from disk)
        if (isFileProtocol || isLocalhost) {
            return host === 'localhost' ? 'http://localhost:8001' : 'http://127.0.0.1:8001';
        }

        // Same-LAN phone access to laptop-hosted frontend (http://192.168.x.x:3000)
        if (isPrivateLanIp) {
            return `${protocol}//${host}:8001`;
        }

        // GitHub Pages or hosted static frontend should call deployed API.
        if (isGithubPagesHost) {
            return 'https://nutrition-backend.onrender.com';
        }

        // Fallback: use deployed backend for any other hosted frontend.
        return 'https://nutrition-backend.onrender.com';
    })(),

    /**
     * Known local API URLs ordered by preference.
     * Used as a fallback list when one local backend port is unavailable.
     */
    LOCAL_API_BASE_URLS: [
        'http://localhost:8001',
        'http://127.0.0.1:8001',
        'http://localhost:8011',
        'http://127.0.0.1:8011'
    ],
    
    /**
     * Request Timeout (milliseconds)
     * Maximum time to wait for an API response
     */
    REQUEST_TIMEOUT: 15000,  // 15 seconds
    
    /**
     * Retry Configuration
     * Number of times to retry failed requests
     */
    RETRY_ATTEMPTS: 2,
    
    /**
     * Debug Mode
     * Set to true for verbose console logging
     */
    ENABLE_DEBUG: true,
    
    /**
     * Token Configuration
     */
    TOKEN: {
        STORAGE_KEY: 'authToken',
        TYPE_STORAGE_KEY: 'authTokenType',
        CLIENT_ID_KEY: 'currentClientId',
        EMAIL_KEY: 'clientEmail',
        FULL_NAME_KEY: 'clientFullName'
    }
};

/**
 * Helper function to log debug messages
 * @param {string} message - Debug message
 * @param {any} data - Optional data to log
 */
function debugLog(message, data = null) {
    if (CONFIG.ENABLE_DEBUG) {
        console.log(`[DEBUG] ${message}`, data || '');
    }
}

/**
 * Helper function to log errors
 * @param {string} message - Error message
 * @param {any} error - Error object
 */
function errorLog(message, error = null) {
    console.error(`[ERROR] ${message}`, error || '');
}

/**
 * Token Management Utilities
 */

/**
 * Get stored auth token
 * @returns {string|null} The auth token or null
 */
function getAuthToken() {
    return localStorage.getItem(CONFIG.TOKEN.STORAGE_KEY);
}

function decodeJwtPayload(token) {
    if (!token) return null;
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
}

/**
 * Check if JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
function isTokenExpired(token = null) {
    const tokenToCheck = token || getAuthToken();
    if (!tokenToCheck) return true;
    
    try {
        const payload = decodeJwtPayload(tokenToCheck);
        if (!payload || !payload.exp) return true;
        
        // Check expiration (exp is in seconds, Date.now() is in milliseconds)
        return payload.exp * 1000 < Date.now();
    } catch (error) {
        errorLog('Token expiration check failed', error);
        return true;
    }
}

function isAuthenticated() {
    const token = getAuthToken() || localStorage.getItem('clientToken');
    return !!token && !isTokenExpired(token);
}

function getCurrentAuthRole() {
    const token = getAuthToken() || localStorage.getItem('clientToken');
    const payload = decodeJwtPayload(token || '');
    if (payload && payload.role) {
        return String(payload.role).toLowerCase();
    }

    const stored = sessionStorage.getItem('role') || localStorage.getItem('authRole') || sessionStorage.getItem('authRole');
    return stored ? String(stored).toLowerCase() : null;
}

function getCurrentPageName() {
    return (window.location.pathname || '').toLowerCase().split('/').pop() || 'index.html';
}
const DOCTOR_ADMIN_SESSION_KEY = 'doctorAdminSessionActive';

function isDoctorAdminSessionActive() {
    return sessionStorage.getItem(DOCTOR_ADMIN_SESSION_KEY) === '1';
}

function markDoctorAdminSessionActive() {
    sessionStorage.setItem(DOCTOR_ADMIN_SESSION_KEY, '1');
}

function isDoctorAdminProtectedPage(pageName = getCurrentPageName()) {
    const protectedPages = new Set([
        'doctor_dashboard.html',
        'doctor-dashboard.html',
        'clients.html',
        'add-client.html',
        'add_team.html',
        'add-team.html',
        'pdf-generator.html',
        'diet-management.html'
    ]);
    return protectedPages.has(pageName);
}

function isUnifiedProtectedPage(pageName = getCurrentPageName()) {
    const protectedPages = new Set([
        'doctor_dashboard.html',
        'doctor-dashboard.html',
        'clients.html',
        'add-client.html',
        'add_team.html',
        'add-team.html',
        'team_view.html',
        'team-view.html',
        'diet-management.html',
        'pdf-generator.html',
        'dashboard.html',
        'doctors.html',
        'teams.html',
        'players.html'
    ]);
    return protectedPages.has(pageName);
}

function isAdminOnlyPage(pageName = getCurrentPageName()) {
    const adminOnlyPages = new Set([
        'add-client.html',
        'pdf-generator.html',
        'diet-management.html'
    ]);
    return adminOnlyPages.has(pageName);
}

function showAdminOnlyMessage() {
    if (document.getElementById('admin-only-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'admin-only-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(15, 23, 42, 0.45)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '10000';
    overlay.innerHTML = `
        <div style="max-width: 460px; width: calc(100% - 32px); background: #ffffff; border-radius: 18px; border: 1px solid #dbe5f0; box-shadow: 0 24px 48px rgba(15, 23, 42, 0.22); padding: 22px; font-family: Arial, sans-serif; text-align: center;">
            <h3 style="margin: 0 0 10px; color: #17324b; font-size: 22px;">Admin Only</h3>
            <p style="margin: 0; color: #51657b; line-height: 1.6; font-size: 15px;">This page is only accessed by the admin.</p>
            <div style="margin-top: 18px; display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
                <button id="admin-only-back-btn" type="button" style="border: 1px solid #4a9ff5; background: #4a9ff5; color: #ffffff; border-radius: 10px; padding: 10px 14px; font-weight: 700; cursor: pointer;">Back to Teams</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const backBtn = document.getElementById('admin-only-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'clients.html';
        });
    }
}

function enforceUnifiedAccessControl() {
    const page = getCurrentPageName();
    if (!isUnifiedProtectedPage(page)) return;

    if (isDoctorAdminProtectedPage(page)) {
        const role = getCurrentAuthRole();
        const isDoctorOrAdmin = role === 'doctor' || role === 'admin';

        if (!isAuthenticated() || !isDoctorOrAdmin || !isDoctorAdminSessionActive()) {
            window.location.href = `doctor-auth.html?next=${encodeURIComponent(page)}`;
            return;
        }

        if (isAdminOnlyPage(page) && role !== 'admin') {
            showAdminOnlyMessage();
            return;
        }
        return;
    }

    if (!isAuthenticated()) {
        if (page === 'add_team.html' || page === 'add-team.html' || page === 'team_view.html' || page === 'team-view.html') {
            window.location.href = `doctor-auth.html?next=${encodeURIComponent(page)}`;
        } else {
            window.location.href = 'client-login.html';
        }
        return;
    }
}

function isProtectedClientPage() {
    const page = (window.location.pathname || '').toLowerCase().split('/').pop() || '';
    const protectedPages = new Set([
        'client-main.html',
        'client-dashboard.html',
        'mental-coaching.html',
        'anti-doping.html',
        'progress-tracking.html',
        'settings.html',
        'supplements.html'
    ]);
    return protectedPages.has(page);
}

let sessionExpiryInProgress = false;

function showSessionExpiredMessage() {
    if (document.getElementById('session-expired-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'session-expired-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(17, 24, 39, 0.45)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';
    overlay.innerHTML = `
        <div style="max-width: 460px; width: calc(100% - 32px); background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.25); padding: 20px 22px; font-family: Arial, sans-serif;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                <div style="font-size:22px;">⏳</div>
                <h3 style="margin:0; font-size:19px; color:#111827;">Session Expired</h3>
            </div>
            <p style="margin:0; color:#374151; line-height:1.5;">Your session has expired. Please log in again.</p>
            <p style="margin:10px 0 0; color:#6b7280; font-size:13px;">Redirecting to login page...</p>
        </div>
    `;

    document.body.appendChild(overlay);
}

function handleSessionExpired(reason = 'expired') {
    if (sessionExpiryInProgress) return;
    sessionExpiryInProgress = true;

    errorLog(`Session invalid (${reason})`);
    clearAllAuthData();
    sessionStorage.removeItem(CONFIG.TOKEN.STORAGE_KEY);
    sessionStorage.removeItem(CONFIG.TOKEN.TYPE_STORAGE_KEY);
    sessionStorage.removeItem('clientToken');

    showSessionExpiredMessage();

    setTimeout(() => {
        window.location.href = 'client-login.html';
    }, 2500);
}

function enforceProtectedPageSession() {
    if (!isProtectedClientPage()) return true;
    if (!isAuthenticated()) {
        handleSessionExpired('missing-or-expired-token');
        return false;
    }
    return true;
}

function installGlobal401Handler() {
    if (window.__global401HandlerInstalled || typeof window.fetch !== 'function') return;
    window.__global401HandlerInstalled = true;

    const nativeFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
        const response = await nativeFetch(...args);
        if (response.status === 401 && isProtectedClientPage()) {
            handleSessionExpired('api-401');
        }
        return response;
    };
}

function applyAuthButtonState(buttonEl, loggedIn) {
    if (!buttonEl) return;
    buttonEl.textContent = loggedIn ? 'My Account' : 'Log In';
    buttonEl.href = loggedIn ? 'client-main.html' : 'client-login.html';
    buttonEl.style.display = 'inline-block';
}

function configurePortalHomeLink() {
    const navHome = document.getElementById('nav-home');
    if (!navHome) return;
    if (sessionStorage.getItem('portalType') === 'client') {
        navHome.href = 'client-home.html';
    }
}

function syncNavbarAuthState() {
    const loggedIn = isAuthenticated();
    applyAuthButtonState(document.getElementById('navAuthButton'), loggedIn);
    applyAuthButtonState(document.getElementById('nav-action'), loggedIn);

    const dynamicButtons = document.querySelectorAll('[data-auth-button="true"]');
    dynamicButtons.forEach((buttonEl) => applyAuthButtonState(buttonEl, loggedIn));
}

function initGlobalNavbarAuthState() {
    configurePortalHomeLink();
    syncNavbarAuthState();
    enforceProtectedPageSession();
    installGlobal401Handler();
    window.addEventListener('storage', syncNavbarAuthState);
    window.addEventListener('pageshow', syncNavbarAuthState);
    window.addEventListener('focus', syncNavbarAuthState);
}

function logout() {
    if (confirm('Are you sure you want to log out?')) {
        if (typeof clearAllAuthData === 'function') clearAllAuthData();
        window.location.href = 'client-home.html';
    }
}

window.isAuthenticated = isAuthenticated;
window.getCurrentAuthRole = getCurrentAuthRole;
window.syncNavbarAuthState = syncNavbarAuthState;
window.initGlobalNavbarAuthState = initGlobalNavbarAuthState;
window.handleSessionExpired = handleSessionExpired;
window.enforceProtectedPageSession = enforceProtectedPageSession;
window.installGlobal401Handler = installGlobal401Handler;
window.logout = logout;

function getAlternativeLocalApiBaseUrl(currentBaseUrl) {
    const current = String(currentBaseUrl || '').replace(/\/$/, '');
    const candidates = Array.isArray(CONFIG.LOCAL_API_BASE_URLS) ? CONFIG.LOCAL_API_BASE_URLS : [];
    const normalizedCandidates = candidates.map((url) => String(url).replace(/\/$/, ''));

    const currentIsLocal = normalizedCandidates.includes(current);
    if (!currentIsLocal) return null;

    return normalizedCandidates.find((url) => url !== current) || null;
}

window.getAlternativeLocalApiBaseUrl = getAlternativeLocalApiBaseUrl;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enforceUnifiedAccessControl);
} else {
    enforceUnifiedAccessControl();
}

/**
 * Get auth headers for API requests
 * @returns {object} Headers object with Authorization header
 */
function getAuthHeaders() {
    const token = getAuthToken();
    
    if (!token) {
        handleSessionExpired('missing-token-before-request');
        return {};
    }

    if (isTokenExpired(token)) {
        handleSessionExpired('expired-token-before-request');
        return {};
    }
    
    // Don't check expiration here - let the backend handle it
    // This prevents false positives from client-side time drift
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

/**
 * Clear all authentication and user data from localStorage
 */
function clearAllAuthData() {
    localStorage.removeItem(CONFIG.TOKEN.STORAGE_KEY);
    localStorage.removeItem(CONFIG.TOKEN.TYPE_STORAGE_KEY);
    localStorage.removeItem(CONFIG.TOKEN.CLIENT_ID_KEY);
    localStorage.removeItem(CONFIG.TOKEN.EMAIL_KEY);
    localStorage.removeItem(CONFIG.TOKEN.FULL_NAME_KEY);
    localStorage.removeItem('authRole');
    sessionStorage.removeItem('authRole');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem(DOCTOR_ADMIN_SESSION_KEY);
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('clientDashboardCache');
    debugLog('All auth data cleared');
}
window.markDoctorAdminSessionActive = markDoctorAdminSessionActive;
window.isDoctorAdminSessionActive = isDoctorAdminSessionActive;

/**
 * Global fetch wrapper with 401 error handling
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
async function apiFetch(url, options = {}) {
    try {
        const response = await fetch(url, options);
        
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
            handleSessionExpired('api-fetch-401');
            return response;
        }
        
        return response;
    } catch (error) {
        errorLog('API request failed', error);
        throw error;
    }
}

// Log configuration on page load (development only)
if (CONFIG.ENABLE_DEBUG) {
    console.group('🔧 Frontend Configuration');
    console.log('API Base URL:', CONFIG.API_BASE_URL);
    console.log('Environment:', window.location.hostname);
    console.log('Debug Mode:', CONFIG.ENABLE_DEBUG);
    console.groupEnd();
}
