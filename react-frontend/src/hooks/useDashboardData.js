import { useEffect, useMemo, useReducer } from 'react';
import { apiClient, getAuthToken } from '../services/api';
import {
  buildDashboardInitialState,
  buildMacroState,
  buildSummary,
  buildTodayMacrosPayload,
  buildTodayMeals,
  dashboardDataReducer,
  normalizeMealStatus,
  readStoredStatuses,
  writeStoredStatuses,
} from './useDashboardDataReducer';

export function useDashboardData() {
  const [state, dispatch] = useReducer(dashboardDataReducer, undefined, buildDashboardInitialState);

  useEffect(() => {
    let mounted = true;

    async function load() {
      dispatch({ type: 'LOAD_START' });
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('Please login first.');
        }

        const profileResponse = await apiClient.get('/api/client/profile');
        if (!mounted) return;

        const data = profileResponse?.data || {};

        const todayMeals = buildTodayMeals(data);
        const backendStatuses = data?.meal_swaps?.meal_statuses || {};
        const localStatuses = readStoredStatuses(data);
        const mergedStatuses = {
          ...backendStatuses,
          ...localStatuses,
        };
        const normalizedStatuses = Object.fromEntries(
          Object.entries(mergedStatuses).map(([mealId, status]) => [mealId, normalizeMealStatus(status)])
        );
        const macro = buildMacroState(data, todayMeals, normalizedStatuses);

        writeStoredStatuses(data, normalizedStatuses);

        dispatch({
          type: 'LOAD_SUCCESS',
          payload: {
            profile: data,
            todayMeals,
            mealStatuses: normalizedStatuses,
            macro,
          },
        });

        const displayName = data.full_name || data.email?.split('@')[0] || 'Client';
        localStorage.setItem('clientFullName', displayName);
        if (data.email) localStorage.setItem('clientEmail', data.email);
      } catch (err) {
        if (!mounted) return;
        const message = err?.response?.data?.detail || err?.message || 'Failed to load dashboard data.';
        dispatch({ type: 'LOAD_ERROR', payload: typeof message === 'string' ? message : 'Failed to load dashboard data.' });
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const syncMacrosToBackend = async (profile, todayMeals, mealStatuses, macro) => {
    if (!profile) return;
    const payload = buildTodayMacrosPayload(todayMeals, mealStatuses, macro);

    const response = await apiClient.post('/api/client/macros/today', payload);
    if (response?.data) {
      dispatch({ type: 'SET_BACKEND_MACRO', payload: response.data });
    }
  };

  const toggleMealStatus = async (mealId) => {
    if (!state.profile) return;
    const currentStatus = normalizeMealStatus(state.mealStatuses[mealId]);
    const nextStatus = currentStatus === 'completed' ? 'not-completed' : 'completed';
    const nextMealStatuses = {
      ...state.mealStatuses,
      [mealId]: nextStatus,
    };

    const nextMacro = buildMacroState(state.profile, state.todayMeals, nextMealStatuses);
    dispatch({ type: 'UPDATE_STATUSES', payload: { mealStatuses: nextMealStatuses, macro: nextMacro } });
    writeStoredStatuses(state.profile, nextMealStatuses);

    dispatch({ type: 'SET_SYNCING', payload: true });
    try {
      const mealSwaps = state.profile.meal_swaps || {};
      await apiClient.put('/api/client/profile', {
        meal_swaps: {
          ...mealSwaps,
          meal_statuses: nextMealStatuses,
        },
      });

      await syncMacrosToBackend(state.profile, state.todayMeals, nextMealStatuses, nextMacro);
    } catch {
      // Keep local state as the immediate source of truth.
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  };

  const summary = useMemo(() => buildSummary(state.profile), [state.profile]);
  const displayName = state.profile?.full_name || state.profile?.email?.split('@')[0] || 'Client';

  return {
    loading: state.loading,
    syncing: state.syncing,
    error: state.error,
    profile: state.profile,
    summary,
    displayName,
    todayMeals: state.todayMeals,
    mealStatuses: state.mealStatuses,
    macro: state.macro,
    toggleMealStatus,
  };
}
