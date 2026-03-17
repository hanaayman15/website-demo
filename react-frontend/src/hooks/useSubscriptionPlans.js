import { useEffect, useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';

const DEFAULT_PLAN = 'once';

function safeStorageGet(key, fallback = '') {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const value = localStorage.getItem(key);
      return value ?? fallback;
    }
  } catch {
    // Ignore storage access failures in restricted runtimes.
  }
  return fallback;
}

function safeStorageSet(key, value) {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage access failures in restricted runtimes.
  }
}

export const CONSULTATION_PLAN_OPTIONS = [
  {
    key: 'once',
    name: 'Once',
    price: '$29',
    subtitle: 'Single consultation session',
    features: ['One detailed consultation', 'Personalized action points', '7-day follow-up notes'],
  },
  {
    key: 'monthly',
    name: 'Monthly',
    price: '$49/month',
    subtitle: 'Ongoing monthly consultation',
    popular: true,
    features: ['2 consultations per month', 'Weekly check-ins', 'Continuous plan adjustments', 'Priority support'],
  },
  {
    key: 'annually',
    name: 'Annually',
    price: '$499/year',
    subtitle: 'Full-year consultation support',
    features: ['Everything in Monthly', 'Annual strategy roadmap', 'Priority rescheduling', 'Competition cycle planning'],
  },
];

export function buildConsultationPayload({ clientId, plan }) {
  return {
    client_id: clientId,
    consultation_type: plan,
    timestamp: new Date().toISOString(),
  };
}

export function resolveOnboardingRedirect() {
  const source = String(safeStorageGet('onboardingSource', 'signup')).toLowerCase();
  const currentClientId = safeStorageGet('currentClientId', '');
  if (source === 'add-client') {
    return currentClientId ? `/client-dashboard?id=${encodeURIComponent(currentClientId)}` : '/client-dashboard';
  }
  return '/profile-setup';
}

export function buildInitialSubscriptionState() {
  return {
    loading: true,
    saving: false,
    selectedPlan: safeStorageGet('selectedPlan', DEFAULT_PLAN) || DEFAULT_PLAN,
    error: '',
    message: '',
  };
}

export function subscriptionPlansReducer(state, action) {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: '' };
    case 'LOAD_DONE':
      return { ...state, loading: false };
    case 'SELECT_PLAN':
      return { ...state, selectedPlan: action.payload, error: '', message: '' };
    case 'SAVE_START':
      return { ...state, saving: true, error: '', message: 'Saving selection...' };
    case 'SAVE_SUCCESS':
      return { ...state, saving: false, error: '', message: action.payload };
    case 'SAVE_ERROR':
      return { ...state, saving: false, error: action.payload, message: '' };
    default:
      return state;
  }
}

function parseApiError(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  return fallback;
}

async function fetchClientProfileId() {
  const response = await apiClient.get('/api/client/profile');
  return response?.data?.id || null;
}

export function useSubscriptionPlans({ saveToBackend = true } = {}) {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(
    subscriptionPlansReducer,
    undefined,
    buildInitialSubscriptionState
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      dispatch({ type: 'LOAD_START' });
      if (!saveToBackend) {
        dispatch({ type: 'LOAD_DONE' });
        return;
      }

      try {
        const response = await apiClient.get('/api/client/consultation');
        const plan = response?.data?.consultation_type;
        if (mounted && plan) {
          dispatch({ type: 'SELECT_PLAN', payload: plan });
          safeStorageSet('selectedPlan', plan);
        }
      } catch {
        // Keep local default when no auth or consultation record exists.
      } finally {
        if (mounted) {
          dispatch({ type: 'LOAD_DONE' });
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [saveToBackend]);

  const selectPlan = (plan) => {
    dispatch({ type: 'SELECT_PLAN', payload: plan });
  };

  const persistSelection = async () => {
    safeStorageSet('selectedPlan', state.selectedPlan);
    if (!saveToBackend) {
      dispatch({ type: 'SAVE_SUCCESS', payload: 'Plan selected locally.' });
      return true;
    }

    dispatch({ type: 'SAVE_START' });
    try {
      const profileId = await fetchClientProfileId();
      if (!profileId) {
        throw new Error('Could not resolve current profile.');
      }

      const payload = buildConsultationPayload({
        clientId: profileId,
        plan: state.selectedPlan,
      });
      await apiClient.post('/api/client/consultation', payload);
      dispatch({ type: 'SAVE_SUCCESS', payload: `Consultation plan saved: ${state.selectedPlan}.` });
      return true;
    } catch (error) {
      dispatch({ type: 'SAVE_ERROR', payload: parseApiError(error, 'Could not save consultation plan. Please retry.') });
      return false;
    }
  };

  const continueFlow = async () => {
    const saved = await persistSelection();
    if (!saved) return;
    navigate(resolveOnboardingRedirect());
  };

  const skipFlow = () => {
    safeStorageSet('selectedPlan', DEFAULT_PLAN);
    navigate(resolveOnboardingRedirect());
  };

  const selectedPlanMeta = useMemo(
    () => CONSULTATION_PLAN_OPTIONS.find((plan) => plan.key === state.selectedPlan) || CONSULTATION_PLAN_OPTIONS[0],
    [state.selectedPlan]
  );

  return {
    state,
    selectedPlanMeta,
    selectPlan,
    continueFlow,
    skipFlow,
  };
}
