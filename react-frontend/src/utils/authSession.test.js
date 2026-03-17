import { afterEach, describe, expect, it } from 'vitest';
import {
  buildSessionSnapshot,
  clearSessionAuth,
  hasDoctorAdminSession,
  persistSessionAuth,
  resolveAuthRole,
  resolveAuthToken,
} from './authSession';

describe('authSession helpers', () => {
  afterEach(() => {
    clearSessionAuth();
    if (typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
      localStorage.removeItem('clientEmail');
    }
  });

  it('persists and resolves token and role', () => {
    persistSessionAuth({
      token: 'header.payload.signature',
      role: 'doctor',
      email: 'Doctor@Example.com',
      doctorSession: true,
    });

    expect(resolveAuthToken()).toBe('header.payload.signature');
    expect(resolveAuthRole()).toBe('doctor');
    expect(hasDoctorAdminSession()).toBe(true);
  });

  it('clears stored session auth keys', () => {
    persistSessionAuth({ token: 'token-123', role: 'admin', doctorSession: true });
    clearSessionAuth();

    expect(resolveAuthToken()).toBe('');
    expect(resolveAuthRole()).toBe('');
    expect(hasDoctorAdminSession()).toBe(false);
  });

  it('builds a stable session snapshot', () => {
    persistSessionAuth({ token: 'token-xyz', role: 'client', email: 'client@example.com' });

    const snapshot = buildSessionSnapshot();
    expect(snapshot.isAuthenticated).toBe(true);
    expect(snapshot.role).toBe('client');
    expect(typeof snapshot.email).toBe('string');
  });
});
