import { useEffect, useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/api';

const DEFAULT_PLAN = 'starter';
const SUBSCRIPTION_STORAGE_KEY = 'subscriptionPlan';

const PLAN_TO_BACKEND = {
  starter: 'once',
  pro: 'monthly',
  elite: 'annually',
};

const BACKEND_TO_PLAN = {
  once: 'starter',
  monthly: 'pro',
  annually: 'elite',
};

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

export const SUBSCRIPTION_PLAN_OPTIONS = [
  {
    key: 'starter',
    name: 'Starter',
    price: '$29/month',
    subtitle: 'Strong foundation for daily consistency',
    features: ['Weekly check-in', 'Core nutrition plan', 'Basic progress tracking'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$69/month',
    subtitle: 'Performance-focused guidance and adjustments',
    popular: true,
    features: ['Twice-weekly check-ins', 'Macro and meal optimization', 'Priority coach support'],
  },
  {
    key: 'elite',
    name: 'Elite',
    price: '$119/month',
    subtitle: 'Full high-performance package for athletes',
    features: ['Daily support cadence', 'Competition phase nutrition', 'Advanced recovery and supplement strategy'],
  },
];

export function buildConsultationPayload({ clientId, plan }) {
  return {
    client_id: clientId,
    consultation_type: PLAN_TO_BACKEND[plan] || PLAN_TO_BACKEND[DEFAULT_PLAN],
    timestamp: new Date().toISOString(),
  };
}

export function resolveOnboardingRedirect({ source, clientId }) {
  const normalizedSource = String(source || safeStorageGet('onboardingSource', 'profile-setup')).toLowerCase();
  const resolvedClientId = String(clientId || safeStorageGet('onboardingClientId', '') || safeStorageGet('currentClientId', '')).trim();
  const params = new URLSearchParams();
  if (resolvedClientId) params.set('client_id', resolvedClientId);
  if (normalizedSource) params.set('flow', normalizedSource);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return `/client-services${suffix}`;
}

export function buildInitialSubscriptionState() {
  const nextPlan = safeStorageGet(SUBSCRIPTION_STORAGE_KEY, '') || safeStorageGet('selectedPlan', DEFAULT_PLAN) || DEFAULT_PLAN;
  const normalized = BACKEND_TO_PLAN[nextPlan] || nextPlan;
  return {
    loading: true,
    saving: false,
    selectedPlan: normalized,
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
  const [searchParams] = useSearchParams();
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
        const backendPlan = response?.data?.consultation_type;
        const plan = BACKEND_TO_PLAN[backendPlan] || backendPlan;
        if (mounted && plan) {
          dispatch({ type: 'SELECT_PLAN', payload: plan });
          safeStorageSet(SUBSCRIPTION_STORAGE_KEY, plan);
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
    safeStorageSet(SUBSCRIPTION_STORAGE_KEY, state.selectedPlan);
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
      dispatch({ type: 'SAVE_SUCCESS', payload: `Subscription plan saved: ${state.selectedPlan}.` });
      return true;
    } catch (error) {
      dispatch({ type: 'SAVE_ERROR', payload: parseApiError(error, 'Could not save subscription plan. Please retry.') });
      return false;
    }
  };

  const continueFlow = async () => {
    const saved = await persistSelection();
    if (!saved) return;
    const source = searchParams.get('flow') || safeStorageGet('onboardingSource', 'profile-setup');
    const clientId = searchParams.get('client_id') || safeStorageGet('onboardingClientId', '') || safeStorageGet('currentClientId', '');
    navigate(resolveOnboardingRedirect({ source, clientId }));
  };

  const skipFlow = () => {
    safeStorageSet(SUBSCRIPTION_STORAGE_KEY, DEFAULT_PLAN);
    safeStorageSet('selectedPlan', DEFAULT_PLAN);
    const source = searchParams.get('flow') || safeStorageGet('onboardingSource', 'profile-setup');
    const clientId = searchParams.get('client_id') || safeStorageGet('onboardingClientId', '') || safeStorageGet('currentClientId', '');
    navigate(resolveOnboardingRedirect({ source, clientId }));
  };

  const selectedPlanMeta = useMemo(
    () => SUBSCRIPTION_PLAN_OPTIONS.find((plan) => plan.key === state.selectedPlan) || SUBSCRIPTION_PLAN_OPTIONS[0],
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
