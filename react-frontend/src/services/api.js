import axios from 'axios';
import { clearSessionAuth, persistSessionAuth, resolveAuthToken } from '../utils/authSession';

function resolveApiBaseUrl() {
  const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
  const isDev = Boolean(import.meta.env.DEV);

  // In Vite development, prefer proxying through same-origin paths to avoid CORS/preflight issues.
  if (isDev) {
    const isLocalConfigured = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configured);
    if (!configured || isLocalConfigured) {
      return '';
    }
  }

  return configured || 'http://127.0.0.1:8001';
}

const API_BASE_URL = resolveApiBaseUrl();

function joinApiUrl(path) {
  const normalizedPath = String(path || '');
  if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
    return normalizedPath;
  }
  if (!API_BASE_URL) {
    return normalizedPath;
  }
  return `${API_BASE_URL}${normalizedPath}`;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getAuthToken() {
  return resolveAuthToken();
}

export function setAuthToken(token) {
  if (!token) {
    clearSessionAuth();
    return;
  }
  persistSessionAuth({ token });
}

export function clearAuthToken() {
  clearSessionAuth();
}

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = Number(error?.response?.status || 0);
    const requestUrl = String(error?.config?.url || '');
    const isAuthEndpoint = /\/doctor\/(login|signup)|\/admin\/login/i.test(requestUrl);

    if (status === 401 && !isAuthEndpoint && typeof window !== 'undefined') {
      clearSessionAuth();
      const currentPath = `${window.location.pathname || '/'}${window.location.search || ''}`;
      const pathname = String(window.location.pathname || '');
      
      // Determine if this is a client page or doctor/admin page
      const isClientPage = /\/(client-dashboard|anti-doping|client-home|client-main|client-recipes|forgot-password|profile-setup|progress|progress-tracking|settings|subscription-plan|client-login|client-signup|dashboard|account-recovery|contact)/.test(pathname);
      
      // Redirect to the appropriate login page
      if (!pathname.startsWith('/client-login') && !pathname.startsWith('/doctor-auth')) {
        const next = encodeURIComponent(currentPath || '/');
        const loginPage = isClientPage ? '/client-login' : '/doctor-auth';
        window.location.assign(`${loginPage}?next=${next}`);
      }
    }

    return Promise.reject(error);
  }
);

export async function fetchJson(url, options = {}) {
  const fullUrl = joinApiUrl(url);
  const response = await fetch(fullUrl, options);
  if (!response.ok) {
    throw new Error('Request failed: ' + response.status);
  }
  return response.json();
}
