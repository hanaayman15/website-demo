import { useReducer } from 'react';
import { apiClient } from '../services/api';

export function buildResetRequestPayload(email) {
  return { email: String(email || '').trim().toLowerCase() };
}

export function buildVerificationPayload({ email, code }) {
  return {
    email: String(email || '').trim().toLowerCase(),
    verification_code: String(code || '').trim(),
  };
}

export function buildCompleteResetPayload({ email, code, newPassword }) {
  return {
    email: String(email || '').trim().toLowerCase(),
    verification_code: String(code || '').trim(),
    new_password: String(newPassword || ''),
  };
}

export function buildInitialPasswordRecoveryState() {
  return {
    step: 'email',
    loading: false,
    error: '',
    message: '',
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  };
}

export function passwordRecoveryReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.payload.field]: action.payload.value };
    case 'REQUEST_START':
      return { ...state, loading: true, error: '', message: '' };
    case 'REQUEST_SUCCESS':
      return { ...state, loading: false, error: '', message: action.payload.message, step: action.payload.step || state.step };
    case 'REQUEST_ERROR':
      return { ...state, loading: false, error: action.payload, message: '' };
    case 'SET_STEP':
      return { ...state, step: action.payload, error: '', message: '' };
    default:
      return state;
  }
}

function parseApiError(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  return fallback;
}

export function usePasswordRecovery() {
  const [state, dispatch] = useReducer(
    passwordRecoveryReducer,
    undefined,
    buildInitialPasswordRecoveryState
  );

  const updateField = (field, value) => {
    dispatch({ type: 'SET_FIELD', payload: { field, value } });
  };

  const submitEmail = async (event) => {
    if (event) event.preventDefault();
    dispatch({ type: 'REQUEST_START' });
    try {
      const payload = buildResetRequestPayload(state.email);
      const response = await apiClient.post('/api/auth/request-password-reset', payload);
      dispatch({
        type: 'REQUEST_SUCCESS',
        payload: {
          step: 'code',
          message: response?.data?.message || 'Verification code sent to your email.',
        },
      });
    } catch (error) {
      dispatch({ type: 'REQUEST_ERROR', payload: parseApiError(error, 'Failed to request reset code.') });
    }
  };

  const submitCode = async (event) => {
    if (event) event.preventDefault();
    dispatch({ type: 'REQUEST_START' });
    try {
      const payload = buildVerificationPayload({ email: state.email, code: state.code });
      await apiClient.post('/api/auth/verify-password-reset-code', payload);
      dispatch({
        type: 'REQUEST_SUCCESS',
        payload: {
          step: 'password',
          message: 'Code verified. Create your new password.',
        },
      });
    } catch (error) {
      dispatch({ type: 'REQUEST_ERROR', payload: parseApiError(error, 'Invalid verification code.') });
    }
  };

  const submitPassword = async (event) => {
    if (event) event.preventDefault();
    if (!state.newPassword || state.newPassword.length < 6) {
      dispatch({ type: 'REQUEST_ERROR', payload: 'Password must be at least 6 characters long.' });
      return;
    }
    if (state.newPassword !== state.confirmPassword) {
      dispatch({ type: 'REQUEST_ERROR', payload: 'Passwords do not match.' });
      return;
    }

    dispatch({ type: 'REQUEST_START' });
    try {
      const payload = buildCompleteResetPayload({
        email: state.email,
        code: state.code,
        newPassword: state.newPassword,
      });
      const response = await apiClient.post('/api/auth/complete-password-reset', payload);
      dispatch({
        type: 'REQUEST_SUCCESS',
        payload: {
          step: 'success',
          message: response?.data?.message || 'Password reset successful.',
        },
      });
    } catch (error) {
      dispatch({ type: 'REQUEST_ERROR', payload: parseApiError(error, 'Failed to reset password.') });
    }
  };

  const resendCode = async () => {
    dispatch({ type: 'REQUEST_START' });
    try {
      const payload = buildResetRequestPayload(state.email);
      const response = await apiClient.post('/api/auth/request-password-reset', payload);
      dispatch({
        type: 'REQUEST_SUCCESS',
        payload: {
          step: 'code',
          message: response?.data?.message || 'A new verification code has been sent.',
        },
      });
    } catch (error) {
      dispatch({ type: 'REQUEST_ERROR', payload: parseApiError(error, 'Failed to resend reset code.') });
    }
  };

  const backToEmail = () => {
    dispatch({ type: 'SET_STEP', payload: 'email' });
    dispatch({ type: 'SET_FIELD', payload: { field: 'code', value: '' } });
  };

  return {
    state,
    updateField,
    submitEmail,
    submitCode,
    submitPassword,
    resendCode,
    backToEmail,
  };
}
