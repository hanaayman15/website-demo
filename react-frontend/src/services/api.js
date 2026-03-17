import axios from 'axios';
import { clearSessionAuth, persistSessionAuth, resolveAuthToken } from '../utils/authSession';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
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

export async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error('Request failed: ' + response.status);
  }
  return response.json();
}
