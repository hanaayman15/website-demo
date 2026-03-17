import { useReducer } from 'react';
import { apiClient, setAuthToken } from '../services/api';

export const SIGNUP_COUNTRY_OPTIONS = [
  { country: 'Egypt', dialCode: '+20' },
  { country: 'Saudi Arabia', dialCode: '+966' },
  { country: 'United Arab Emirates', dialCode: '+971' },
  { country: 'Kuwait', dialCode: '+965' },
  { country: 'Qatar', dialCode: '+974' },
  { country: 'United States', dialCode: '+1' },
  { country: 'United Kingdom', dialCode: '+44' },
];

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures in restricted runtimes.
  }
}

export function extractErrorMessage(payload, fallbackMessage) {
  if (!payload) return fallbackMessage;
  if (typeof payload === 'string') return payload;

  const detail = payload.detail;
  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    const joined = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.msg) return item.msg;
        return '';
      })
      .filter(Boolean)
      .join(' | ');
    return joined || fallbackMessage;
  }

  if (detail && typeof detail === 'object') {
    if (detail.msg) return detail.msg;
    return fallbackMessage;
  }

  return typeof payload.message === 'string' ? payload.message : fallbackMessage;
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function normalizePhoneNumber(localPhone) {
  return String(localPhone || '').replace(/\D/g, '');
}

export function resolveDialCode(countryName) {
  const option = SIGNUP_COUNTRY_OPTIONS.find((item) => item.country === countryName);
  return option?.dialCode || '+20';
}

export function buildNormalizedPhone(countryName, localPhone) {
  const digits = normalizePhoneNumber(localPhone);
  const dialCode = resolveDialCode(countryName);
  return digits ? `${dialCode}${digits}` : '';
}

export function buildSignupRegistrationPayload(form) {
  return {
    email: normalizeEmail(form.email),
    password: String(form.password || ''),
    full_name: `${String(form.firstName || '').trim()} ${String(form.lastName || '').trim()}`.trim(),
  };
}

export function buildSignupProfilePayload(form) {
  return {
    phone: buildNormalizedPhone(form.country, form.phone),
    country: String(form.country || ''),
    sport: String(form.sport || ''),
  };
}

export function buildClientSignupInitialState() {
  return {
    form: {
      firstName: '',
      lastName: '',
      email: '',
      country: 'Egypt',
      phone: '',
      sport: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    },
    submitting: false,
    error: '',
    success: '',
  };
}

export function clientSignupReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        form: {
          ...state.form,
          [action.payload.field]: action.payload.value,
        },
      };
    case 'SUBMIT_START':
      return { ...state, submitting: true, error: '', success: '' };
    case 'SUBMIT_ERROR':
      return { ...state, submitting: false, error: action.payload, success: '' };
    case 'SUBMIT_SUCCESS':
      return { ...state, submitting: false, error: '', success: action.payload };
    default:
      return state;
  }
}

function validateSignupForm(form) {
  if (!String(form.firstName || '').trim() || !String(form.lastName || '').trim()) {
    return 'First and last name are required.';
  }

  const email = normalizeEmail(form.email);
  if (!email || !email.includes('@')) {
    return 'Please provide a valid email address.';
  }

  const phoneDigits = normalizePhoneNumber(form.phone);
  if (phoneDigits.length < 6) {
    return 'Please provide a valid phone number.';
  }

  if (!String(form.sport || '').trim()) {
    return 'Please select your sport.';
  }

  if (String(form.password || '').length < 6) {
    return 'Password must be at least 6 characters.';
  }

  if (form.password !== form.confirmPassword) {
    return 'Passwords do not match.';
  }

  if (!form.termsAccepted) {
    return 'Please accept the terms and privacy policy.';
  }

  return '';
}

export function useClientSignup() {
  const [state, dispatch] = useReducer(clientSignupReducer, undefined, buildClientSignupInitialState);

  const updateField = (field, value) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { field, value } });
  };

  const submitSignup = async () => {
    const validationError = validateSignupForm(state.form);
    if (validationError) {
      dispatch({ type: 'SUBMIT_ERROR', payload: validationError });
      return { ok: false };
    }

    dispatch({ type: 'SUBMIT_START' });

    const registerPayload = buildSignupRegistrationPayload(state.form);
    const profilePayload = buildSignupProfilePayload(state.form);

    try {
      const registerResponse = await apiClient.post('/api/auth/register', registerPayload);
      const registerData = registerResponse?.data || {};

      const loginResponse = await apiClient.post('/api/auth/login', {
        email: registerPayload.email,
        password: registerPayload.password,
      });

      const loginData = loginResponse?.data || {};
      const token = String(loginData.access_token || '');
      if (!token) {
        dispatch({ type: 'SUBMIT_ERROR', payload: 'Signup successful, but auto-login failed. Please login manually.' });
        return { ok: false };
      }

      setAuthToken(token);
      safeStorageSet('authTokenType', String(loginData.token_type || 'bearer'));
      safeStorageSet('clientEmail', registerPayload.email);
      safeStorageSet('clientFullName', registerPayload.full_name);
      safeStorageSet('clientSport', profilePayload.sport);
      safeStorageSet('clientPhone', profilePayload.phone);
      safeStorageSet('clientPhoneCountry', profilePayload.country || 'Egypt');
      safeStorageSet('onboardingSource', 'signup');

      try {
        await apiClient.put('/api/client/profile', profilePayload);
      } catch {
        // Profile write should not block signup completion.
      }

      try {
        const profileResponse = await apiClient.get('/api/client/profile');
        const profileId = profileResponse?.data?.display_id || profileResponse?.data?.id;
        if (profileId) {
          safeStorageSet('currentClientId', String(profileId));
        }
      } catch {
        const fallbackClientId = registerData?.user_id || loginData?.user_id;
        if (fallbackClientId) {
          safeStorageSet('currentClientId', String(fallbackClientId));
        }
      }

      dispatch({ type: 'SUBMIT_SUCCESS', payload: 'Account created successfully. Redirecting...' });
      return { ok: true };
    } catch (error) {
      dispatch({
        type: 'SUBMIT_ERROR',
        payload: extractErrorMessage(error?.response?.data, `Unable to connect to server: ${error.message || 'Network error'}`),
      });
      return { ok: false };
    }
  };

  return {
    state,
    countryOptions: SIGNUP_COUNTRY_OPTIONS,
    updateField,
    submitSignup,
  };
}
