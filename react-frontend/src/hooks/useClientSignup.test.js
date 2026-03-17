import { describe, expect, it } from 'vitest';
import {
  buildClientSignupInitialState,
  buildNormalizedPhone,
  buildSignupProfilePayload,
  buildSignupRegistrationPayload,
  clientSignupReducer,
  extractErrorMessage,
} from './useClientSignup';

describe('useClientSignup helpers', () => {
  it('builds registration payload and normalizes email', () => {
    const payload = buildSignupRegistrationPayload({
      firstName: 'A',
      lastName: 'User',
      email: 'A.User@Example.com ',
      password: 'secret123',
    });

    expect(payload.email).toBe('a.user@example.com');
    expect(payload.full_name).toBe('A User');
  });

  it('builds profile payload with normalized phone', () => {
    const payload = buildSignupProfilePayload({ country: 'Egypt', phone: '010-123-4567', sport: 'Football' });
    expect(payload.phone).toBe(buildNormalizedPhone('Egypt', '010-123-4567'));
    expect(payload.sport).toBe('Football');
  });

  it('extracts array detail error messages', () => {
    const message = extractErrorMessage({ detail: [{ msg: 'Email already exists' }] }, 'fallback');
    expect(message).toContain('Email already exists');
  });

  it('updates reducer states for submit error', () => {
    const initial = buildClientSignupInitialState();
    const submitting = clientSignupReducer(initial, { type: 'SUBMIT_START' });
    const errored = clientSignupReducer(submitting, { type: 'SUBMIT_ERROR', payload: 'Bad request' });
    expect(errored.submitting).toBe(false);
    expect(errored.error).toBe('Bad request');
  });
});
