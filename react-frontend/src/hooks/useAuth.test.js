import { describe, expect, it } from 'vitest';
import {
  authReducer,
  buildAuthPayload,
  buildInitialAuthState,
  candidatePaths,
} from './useAuth';

describe('useAuth helpers', () => {
  it('builds signup payload with normalized fields', () => {
    const payload = buildAuthPayload('signup', {
      fullName: '  Doctor User  ',
      email: '  DOC@Example.com ',
      password: 'secret123',
    });

    expect(payload).toEqual({
      full_name: 'Doctor User',
      email: 'doc@example.com',
      password: 'secret123',
    });
  });

  it('returns both api and non-api endpoint candidates', () => {
    expect(candidatePaths('/doctor/login')).toEqual(['/doctor/login', '/api/doctor/login']);
    expect(candidatePaths('/api/admin/login')).toEqual(['/api/admin/login', '/admin/login']);
  });

  it('updates reducer state for tab and field actions', () => {
    const initial = buildInitialAuthState();
    const switched = authReducer(initial, { type: 'SET_TAB', payload: 'signup' });
    expect(switched.activeTab).toBe('signup');

    const edited = authReducer(switched, {
      type: 'UPDATE_FIELD',
      payload: { formKey: 'signupForm', field: 'fullName', value: 'Dr Harness' },
    });
    expect(edited.signupForm.fullName).toBe('Dr Harness');
  });
});
