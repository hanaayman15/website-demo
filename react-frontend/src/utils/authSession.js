import { getStorage, safeGet, safeRemove, safeSet } from './storageSafe';

const LOCAL = getStorage('local');
const SESSION = getStorage('session');

function decodeRoleFromToken(token) {
  try {
    const payload = JSON.parse(atob(String(token || '').split('.')[1] || ''));
    return String(payload?.role || '').toLowerCase();
  } catch {
    return '';
  }
}

export function resolveAuthToken() {
  return (
    safeGet(SESSION, 'token') ||
    safeGet(SESSION, 'access_token') ||
    safeGet(LOCAL, 'token') ||
    safeGet(LOCAL, 'access_token') ||
    safeGet(LOCAL, 'authToken') ||
    ''
  );
}

export function resolveAuthRole() {
  const role = String(
    safeGet(SESSION, 'role') ||
      safeGet(SESSION, 'authRole') ||
      ''
  ).toLowerCase();
  if (role) return role;
  return decodeRoleFromToken(resolveAuthToken());
}

export function hasDoctorAdminSession() {
  return safeGet(SESSION, 'doctorAdminSessionActive') === '1';
}

export function persistSessionAuth({ token, tokenType = 'bearer', role = '', email = '', doctorSession = false }) {
  if (!token) return;
  const normalizedRole = String(role || decodeRoleFromToken(token) || '').toLowerCase();

  safeSet(SESSION, 'token', token);
  safeSet(SESSION, 'access_token', token);
  safeSet(SESSION, 'authTokenType', tokenType);

  // Keep a local mirror so auth survives normal browser navigation/back flows.
  safeSet(LOCAL, 'token', token);
  safeSet(LOCAL, 'access_token', token);
  safeSet(LOCAL, 'authToken', token);
  safeSet(LOCAL, 'authTokenType', tokenType);

  if (normalizedRole) {
    safeSet(SESSION, 'authRole', normalizedRole);
    safeSet(SESSION, 'role', normalizedRole);
    safeSet(LOCAL, 'authRole', normalizedRole);
  }

  if (email) {
    safeSet(LOCAL, 'clientEmail', String(email).trim().toLowerCase());
  }

  if (doctorSession) {
    safeSet(SESSION, 'doctorAdminSessionActive', '1');
  }
}

export function clearSessionAuth() {
  safeRemove(LOCAL, 'authToken');
  safeRemove(LOCAL, 'token');
  safeRemove(LOCAL, 'access_token');
  safeRemove(LOCAL, 'authRole');
  safeRemove(LOCAL, 'authTokenType');
  safeRemove(SESSION, 'token');
  safeRemove(SESSION, 'access_token');
  safeRemove(SESSION, 'authRole');
  safeRemove(SESSION, 'role');
  safeRemove(SESSION, 'doctorAdminSessionActive');
}

export function buildSessionSnapshot() {
  const token = resolveAuthToken();
  const role = resolveAuthRole();
  const email = safeGet(LOCAL, 'clientEmail') || '';
  return {
    token,
    role,
    email,
    isAuthenticated: Boolean(token),
    hasDoctorSession: hasDoctorAdminSession(),
  };
}
