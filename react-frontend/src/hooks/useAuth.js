import { useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { persistSessionAuth } from '../utils/authSession';

export function buildAuthPayload(mode, formState) {
  if (mode === 'signup') {
    return {
      full_name: String(formState.fullName || '').trim(),
      email: String(formState.email || '').trim().toLowerCase(),
      password: String(formState.password || ''),
    };
  }

  return {
    email: String(formState.email || '').trim().toLowerCase(),
    password: String(formState.password || ''),
  };
}

export function candidatePaths(path) {
  if (String(path).startsWith('/api/')) {
    return [path, path.replace(/^\/api/, '')];
  }
  return [path, `/api${path}`];
}

export function buildInitialAuthState() {
  return {
    activeTab: 'login',
    submitting: false,
    error: '',
    message: '',
    loginForm: {
      email: '',
      password: '',
    },
    signupForm: {
      fullName: '',
      email: '',
      password: '',
    },
    adminForm: {
      email: 'admin@demo.com',
      password: '',
    },
  };
}

export function authReducer(state, action) {
  switch (action.type) {
    case 'SET_TAB':
      return {
        ...state,
        activeTab: action.payload,
        error: '',
        message: '',
      };
    case 'UPDATE_FIELD':
      return {
        ...state,
        [action.payload.formKey]: {
          ...state[action.payload.formKey],
          [action.payload.field]: action.payload.value,
        },
      };
    case 'SUBMIT_START':
      return {
        ...state,
        submitting: true,
        error: '',
        message: 'Submitting...',
      };
    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        submitting: false,
        error: '',
        message: action.payload,
      };
    case 'SUBMIT_ERROR':
      return {
        ...state,
        submitting: false,
        error: action.payload,
        message: '',
      };
    default:
      return state;
  }
}

function normalizeError(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  return fallback;
}

function endpointForMode(mode) {
  if (mode === 'signup') return '/doctor/signup';
  if (mode === 'admin') return '/admin/login';
  return '/doctor/login';
}

function formKeyForMode(mode) {
  if (mode === 'signup') return 'signupForm';
  if (mode === 'admin') return 'adminForm';
  return 'loginForm';
}

function successMessageForMode(mode) {
  if (mode === 'signup') return 'Doctor account created. Redirecting...';
  if (mode === 'admin') return 'Admin login successful. Redirecting...';
  return 'Doctor login successful. Redirecting...';
}

function expectedRole(mode) {
  return mode === 'admin' ? 'admin' : 'doctor';
}

function persistAuth(data, email, roleHint) {
  const token = String(data?.access_token || '');
  const tokenType = String(data?.token_type || 'bearer');
  const role = String(data?.role || roleHint || 'doctor').toLowerCase();

  persistSessionAuth({
    token,
    tokenType,
    role,
    email,
    doctorSession: true,
  });
}

export function useAuth(nextPath = '/doctor-dashboard') {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(authReducer, undefined, buildInitialAuthState);

  const setTab = (tab) => {
    dispatch({ type: 'SET_TAB', payload: tab });
  };

  const updateField = (formKey, field, value) => {
    dispatch({
      type: 'UPDATE_FIELD',
      payload: { formKey, field, value },
    });
  };

  const submit = async (mode, event) => {
    if (event) event.preventDefault();

    const formKey = formKeyForMode(mode);
    const formState = state[formKey];
    const payload = buildAuthPayload(mode, formState);
    const hasEmail = payload.email && payload.email.includes('@');
    const hasPassword = String(payload.password || '').length >= 6 || mode !== 'signup';

    if (!hasEmail || !String(payload.password || '').trim()) {
      dispatch({ type: 'SUBMIT_ERROR', payload: 'Please provide valid credentials.' });
      return;
    }
    if (mode === 'signup' && !String(payload.full_name || '').trim()) {
      dispatch({ type: 'SUBMIT_ERROR', payload: 'Full name is required for doctor signup.' });
      return;
    }
    if (mode === 'signup' && !hasPassword) {
      dispatch({ type: 'SUBMIT_ERROR', payload: 'Password must be at least 6 characters for signup.' });
      return;
    }

    dispatch({ type: 'SUBMIT_START' });

    const endpoint = endpointForMode(mode);
    const paths = candidatePaths(endpoint);
    let lastError = 'Authentication failed.';

    for (const path of paths) {
      try {
        const response = await apiClient.post(path, payload);
        const data = response?.data || {};
        if (!data.access_token) {
          lastError = 'Authentication response did not include a token.';
          continue;
        }

        persistAuth(data, payload.email, expectedRole(mode));
        dispatch({ type: 'SUBMIT_SUCCESS', payload: successMessageForMode(mode) });
        window.setTimeout(() => navigate(nextPath), 350);
        return;
      } catch (error) {
        if (error?.response?.status === 404) {
          lastError = normalizeError(error, 'Authentication endpoint not found.');
          continue;
        }
        lastError = normalizeError(error, 'Authentication failed.');
        break;
      }
    }

    dispatch({ type: 'SUBMIT_ERROR', payload: lastError });
  };

  const canSubmit = useMemo(() => {
    const key = formKeyForMode(state.activeTab);
    const form = state[key];
    const hasEmail = String(form.email || '').trim().length > 0;
    const hasPassword = String(form.password || '').length > 0;
    if (state.activeTab === 'signup') {
      return hasEmail && hasPassword && String(form.fullName || '').trim().length > 0 && !state.submitting;
    }
    return hasEmail && hasPassword && !state.submitting;
  }, [state]);

  return {
    state,
    canSubmit,
    setTab,
    updateField,
    submit,
  };
}
