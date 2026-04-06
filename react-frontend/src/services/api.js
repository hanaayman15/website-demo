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
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let refreshTokenPromise = null;

function isAuthEndpoint(requestUrl) {
  return /\/api\/auth\/(login|register|refresh|logout|change-password)|\/doctor\/(login|signup)|\/api\/doctor\/(login|signup)|\/admin\/login/i.test(
    String(requestUrl || '')
  );
}

async function requestAccessTokenRefresh() {
  if (!refreshTokenPromise) {
    refreshTokenPromise = refreshClient
      .post('/api/auth/refresh', {})
      .then((response) => {
        const data = response?.data || {};
        const token = String(data.access_token || '');
        if (!token) {
          throw new Error('Refresh response did not include an access token.');
        }

        persistSessionAuth({
          token,
          tokenType: String(data.token_type || 'bearer'),
          role: String(data.role || ''),
          email: String(data.email || ''),
          doctorSession: String(data.role || '').toLowerCase() === 'doctor',
        });

        return token;
      })
      .finally(() => {
        refreshTokenPromise = null;
      });
  }

  return refreshTokenPromise;
}

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
  async (error) => {
    const status = Number(error?.response?.status || 0);
    const requestUrl = String(error?.config?.url || '');
    const originalRequest = error?.config || {};

    if (status === 401 && !isAuthEndpoint(requestUrl) && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await requestAccessTokenRefresh();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient.request(originalRequest);
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
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

        return Promise.reject(refreshError);
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
