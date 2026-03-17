import { describe, expect, it } from 'vitest';
import {
  buildCompleteResetPayload,
  buildResetRequestPayload,
  buildVerificationPayload,
  passwordRecoveryReducer,
} from './usePasswordRecovery';

describe('usePasswordRecovery helpers', () => {
  it('normalizes email for reset request payload', () => {
    const payload = buildResetRequestPayload(' USER@Example.com ');
    expect(payload).toEqual({ email: 'user@example.com' });
  });

  it('builds verification and complete reset payloads', () => {
    const verify = buildVerificationPayload({ email: 'A@B.com ', code: ' 123456 ' });
    expect(verify).toEqual({ email: 'a@b.com', verification_code: '123456' });

    const complete = buildCompleteResetPayload({ email: 'A@B.com ', code: ' 654321 ', newPassword: 'pass123' });
    expect(complete.email).toBe('a@b.com');
    expect(complete.verification_code).toBe('654321');
    expect(complete.new_password).toBe('pass123');
  });

  it('moves reducer state through success transitions', () => {
    const initial = {
      step: 'email',
      loading: false,
      error: '',
      message: '',
      email: '',
      code: '',
      newPassword: '',
      confirmPassword: '',
    };
    const started = passwordRecoveryReducer(initial, { type: 'REQUEST_START' });
    expect(started.loading).toBe(true);

    const success = passwordRecoveryReducer(started, {
      type: 'REQUEST_SUCCESS',
      payload: { step: 'code', message: 'sent' },
    });
    expect(success.loading).toBe(false);
    expect(success.step).toBe('code');
  });
});
