import { useEffect, useMemo, useReducer } from 'react';
import { apiClient } from '../services/api';
import { getStorage, safeGet, safeJsonGet, safeJsonSet, safeSet } from '../utils/storageSafe';
import { clearSessionAuth } from '../utils/authSession';
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

function mergePreferNonEmpty(base = {}, incoming = {}) {
  const next = { ...(base || {}) };
  Object.entries(incoming || {}).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === 'string' && value.trim() === '') return;
    next[key] = value;
  });
  return next;
}

function normalizeProfileAliases(profile = {}) {
  const full = profile?.fullProfileForm || {};
  const next = { ...profile };

  const missingText = (value) => value == null || String(value).trim() === '';
  const missingNumber = (value) => {
    const n = Number(value);
    return !Number.isFinite(n) || n <= 0;
  };

  if (missingText(next.full_name) && !missingText(next.name)) next.full_name = next.name;
  if (missingNumber(next.goal_weight) && !missingNumber(next.goalWeight)) next.goal_weight = next.goalWeight;
  if (missingNumber(next.protein_target) && !missingNumber(next.proteinTarget)) next.protein_target = next.proteinTarget;
  if (missingNumber(next.carbs_target) && !missingNumber(next.carbsTarget)) next.carbs_target = next.carbsTarget;
  if (missingNumber(next.fats_target) && !missingNumber(next.fatsTarget)) next.fats_target = next.fatsTarget;
  if (missingText(next.competition_date) && !missingText(next.competitionDate)) next.competition_date = next.competitionDate;
  if (missingNumber(next.water_in_body) && !missingNumber(next.waterInBody)) next.water_in_body = next.waterInBody;
  if (missingNumber(next.water_intake) && !missingNumber(next.waterIntake)) next.water_intake = next.waterIntake;
  if (missingText(next.activity_level) && !missingText(next.activityLevel)) next.activity_level = next.activityLevel;

  if (missingNumber(next.weight) && !missingNumber(full.weight)) next.weight = full.weight;
  if (missingNumber(next.height) && !missingNumber(full.height)) next.height = full.height;
  if (missingNumber(next.tdee) && !missingNumber(full.tdee)) next.tdee = full.tdee;
  if (missingNumber(next.goal_weight) && !missingNumber(full.goalWeight)) next.goal_weight = full.goalWeight;
  if (missingText(next.competition_date) && !missingText(full.competitionDate)) next.competition_date = full.competitionDate;
  if (missingNumber(next.protein_target) && !missingNumber(full.proteinTarget)) next.protein_target = full.proteinTarget;
  if (missingNumber(next.carbs_target) && !missingNumber(full.carbsTarget)) next.carbs_target = full.carbsTarget;
  if (missingNumber(next.fats_target) && !missingNumber(full.fatsTarget)) next.fats_target = full.fatsTarget;
  if (missingText(next.activity_level) && !missingText(full.activityLevel)) next.activity_level = full.activityLevel;

  return next;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    return value;
  }
  return '';
}

function normalizeMealText(meal = {}) {
  return {
    ...meal,
    en: firstNonEmpty(meal?.en, meal?.description_en, meal?.description, meal?.name, meal?.meal),
    ar: firstNonEmpty(meal?.ar, meal?.description_ar),
  };
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isProfileIdentityMismatch(local, remoteProfile = {}) {
  const expectedEmail = normalizeEmail(safeGet(local, 'clientEmail', ''));
  const profileEmail = normalizeEmail(remoteProfile?.email);
  if (!expectedEmail || !profileEmail) return false;
  return expectedEmail !== profileEmail;
}

function redirectToClientLogin() {
  if (typeof window === 'undefined') return;
  const next = encodeURIComponent(`${window.location.pathname || '/client-dashboard'}${window.location.search || ''}`);
  window.location.assign(`/client-login?next=${next}`);
}

function readCachedProfile(local, remoteProfile = {}) {
  const candidateIds = [
    remoteProfile?.user_id,
    remoteProfile?.id,
    remoteProfile?.display_id,
    safeGet(local, 'currentClientId', ''),
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  const uniqueIds = Array.from(new Set(candidateIds));
  let merged = { ...(remoteProfile || {}) };

  uniqueIds.forEach((id) => {
    merged = mergePreferNonEmpty(merged, safeJsonGet(local, `clientData_${id}`, {}));
    merged = mergePreferNonEmpty(merged, safeJsonGet(local, `clientDashboardCache_${id}`, {}));
    merged = mergePreferNonEmpty(merged, safeJsonGet(local, `clientFullProfile_${id}`, {}));
  });
  return normalizeProfileAliases(merged);
}

function writeProfileCaches(local, profile) {
  if (!profile) return;
  const candidateIds = [profile?.user_id, profile?.id, profile?.display_id]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  const uniqueIds = Array.from(new Set(candidateIds));
  uniqueIds.forEach((id) => {
    const dataKey = `clientData_${id}`;
    const dashboardKey = `clientDashboardCache_${id}`;
    const fullProfileKey = `clientFullProfile_${id}`;

    const existingData = safeJsonGet(local, dataKey, {}) || {};
    const existingDashboard = safeJsonGet(local, dashboardKey, {}) || {};
    const existingFullProfile = safeJsonGet(local, fullProfileKey, {}) || {};

    safeJsonSet(local, dataKey, { ...existingData, ...profile });
    safeJsonSet(local, dashboardKey, { ...existingDashboard, ...profile });
    safeJsonSet(local, fullProfileKey, { ...existingFullProfile, ...profile });
  });
}

function buildWeeklyMeals(profile) {
  const dayMeals = profile?.meal_swaps?.dayMeals || {};
  return Object.entries(dayMeals).reduce((acc, [dayName, meals]) => {
    if (!Array.isArray(meals)) {
      acc[dayName] = [];
      return acc;
    }
    acc[dayName] = meals.map((meal, index) => {
      const normalized = normalizeMealText(meal);
      return {
      dayName,
      mealIndex: index,
      mealKey: String(meal?.type || '').toLowerCase(),
      mealLabel: meal?.type || `Meal ${index + 1}`,
      scheduledTime: meal?.time || 'N/A',
      en: normalized.en,
      ar: normalized.ar,
      protein: meal?.protein,
      carbs: meal?.carbs,
      fats: meal?.fats,
      calories: meal?.calories,
      };
    });
    return acc;
  }, {});
}

export function useDashboardData() {
  const local = getStorage('local');
  const [state, dispatch] = useReducer(dashboardDataReducer, undefined, buildDashboardInitialState);

  useEffect(() => {
    let mounted = true;

    async function load() {
      dispatch({ type: 'LOAD_START' });
      try {
        const profileResponse = await apiClient.get('/api/client/profile');
        if (!mounted) return;

        const remoteData = profileResponse?.data || {};
        if (isProfileIdentityMismatch(local, remoteData)) {
          clearSessionAuth();
          dispatch({ type: 'LOAD_ERROR', payload: 'Session/account mismatch detected. Please login again.' });
          redirectToClientLogin();
          return;
        }
        const data = readCachedProfile(local, remoteData);

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
        safeSet(local, 'clientFullName', displayName);
        if (data.email) safeSet(local, 'clientEmail', data.email);
        const resolvedCurrentId = String(data.user_id || data.id || data.display_id || '').trim();
        if (resolvedCurrentId) {
          safeSet(local, 'currentClientId', resolvedCurrentId);
        }
        writeProfileCaches(local, data);
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

    await apiClient.post('/api/client/macros/today', payload);
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
      writeProfileCaches(local, {
        ...state.profile,
        meal_swaps: {
          ...mealSwaps,
          meal_statuses: nextMealStatuses,
        },
      });
    } catch {
      // Keep local state as the immediate source of truth.
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  };

  const saveCompetitionDate = async (competitionDate) => {
    if (!state.profile) return false;
    const normalized = String(competitionDate || '').trim() || null;
    const nextProfile = { ...state.profile, competition_date: normalized };
    const nextMeals = buildTodayMeals(nextProfile);
    const nextMacro = buildMacroState(nextProfile, nextMeals, state.mealStatuses);

    dispatch({ type: 'UPDATE_PROFILE', payload: { profile: nextProfile, todayMeals: nextMeals, macro: nextMacro } });
    writeProfileCaches(local, nextProfile);

    try {
      await apiClient.put('/api/client/profile', { competition_date: normalized });
      return true;
    } catch {
      return false;
    }
  };

  const swapMeal = async ({ dayName, mealIndex, replacementMeal }) => {
    if (!state.profile || !dayName || mealIndex === null || mealIndex === undefined || !replacementMeal) return false;

    const mealSwaps = state.profile?.meal_swaps || {};
    const dayMeals = { ...(mealSwaps.dayMeals || {}) };
    const sourceMeals = Array.isArray(dayMeals[dayName]) ? [...dayMeals[dayName]] : [];
    if (!sourceMeals[mealIndex]) return false;

    const source = sourceMeals[mealIndex] || {};
    const incoming = normalizeMealText(replacementMeal || {});
    sourceMeals[mealIndex] = {
      ...source,
      ...incoming,
      en: firstNonEmpty(incoming.en, source.en, source.description_en, source.description),
      ar: firstNonEmpty(incoming.ar, source.ar, source.description_ar),
      description_en: firstNonEmpty(incoming.description_en, incoming.en, source.description_en),
      description_ar: firstNonEmpty(incoming.description_ar, incoming.ar, source.description_ar),
      description: firstNonEmpty(incoming.description, incoming.en, source.description),
      type: source?.type || incoming?.type,
    };
    dayMeals[dayName] = sourceMeals;

    const nextProfile = {
      ...state.profile,
      meal_swaps: {
        ...mealSwaps,
        dayMeals,
      },
    };

    const nextTodayMeals = buildTodayMeals(nextProfile);
    const nextMacro = buildMacroState(nextProfile, nextTodayMeals, state.mealStatuses);

    dispatch({ type: 'UPDATE_PROFILE', payload: { profile: nextProfile, todayMeals: nextTodayMeals, macro: nextMacro } });
    writeProfileCaches(local, nextProfile);

    try {
      await apiClient.put('/api/client/profile', {
        meal_swaps: {
          ...nextProfile.meal_swaps,
          meal_statuses: state.mealStatuses,
        },
      });
      return true;
    } catch {
      return false;
    }
  };

  const addCustomSupplement = async ({ name, amount, notes }) => {
    if (!state.profile) return false;
    const trimmedName = String(name || '').trim();
    if (!trimmedName) return false;

    const clientId = Number(state.profile?.id || state.profile?.display_id || safeGet(local, 'currentClientId', 0)) || 0;
    const row = {
      clientId,
      name: trimmedName,
      amount: String(amount || '').trim(),
      notes: String(notes || '').trim(),
      createdAt: new Date().toISOString(),
    };

    const current = safeJsonGet(local, 'clientSupplements', []);
    const next = Array.isArray(current) ? [...current, row] : [row];
    safeJsonSet(local, 'clientSupplements', next);

    const existingSupplements = String(state.profile?.supplements || '').trim();
    const appended = `${trimmedName}${row.amount ? ` (${row.amount}g)` : ''}${row.notes ? ` - ${row.notes}` : ''}`;
    const nextSupplementsText = existingSupplements ? `${existingSupplements}; ${appended}` : appended;
    const nextProfile = { ...state.profile, supplements: nextSupplementsText };

    dispatch({ type: 'UPDATE_PROFILE', payload: { profile: nextProfile } });
    writeProfileCaches(local, nextProfile);

    try {
      await apiClient.put('/api/client/profile', { supplements: nextSupplementsText });
    } catch {
      // Keep local supplement list as fallback if backend write fails.
    }

    return true;
  };

  const refresh = async (clearCache = false) => {
    try {
      if (clearCache) {
        const ids = [state.profile?.user_id, state.profile?.id, state.profile?.display_id, safeGet(local, 'currentClientId', '')]
          .map((v) => String(v || '').trim())
          .filter(Boolean);
        ids.forEach((id) => {
          localStorage.removeItem(`clientData_${id}`);
          localStorage.removeItem(`clientDashboardCache_${id}`);
          localStorage.removeItem(`clientFullProfile_${id}`);
        });
      }
      const response = await apiClient.get('/api/client/profile');
      const serverData = response?.data || {};
      if (isProfileIdentityMismatch(local, serverData)) {
        clearSessionAuth();
        redirectToClientLogin();
        return false;
      }
      const data = clearCache ? serverData : readCachedProfile(local, serverData);
      const nextMeals = buildTodayMeals(data);
      const nextStatuses = {
        ...(data?.meal_swaps?.meal_statuses || {}),
        ...readStoredStatuses(data),
      };
      const normalizedStatuses = Object.fromEntries(
        Object.entries(nextStatuses).map(([mealId, status]) => [mealId, normalizeMealStatus(status)])
      );
      const nextMacro = buildMacroState(data, nextMeals, normalizedStatuses);
      dispatch({
        type: 'LOAD_SUCCESS',
        payload: {
          profile: data,
          todayMeals: nextMeals,
          mealStatuses: normalizedStatuses,
          macro: nextMacro,
        },
      });
      const resolvedCurrentId = String(data.user_id || data.id || data.display_id || '').trim();
      if (resolvedCurrentId) {
        safeSet(local, 'currentClientId', resolvedCurrentId);
      }
      writeStoredStatuses(data, normalizedStatuses);
      writeProfileCaches(local, data);
      return true;
    } catch {
      return false;
    }
  };

  const summary = useMemo(() => buildSummary(state.profile), [state.profile]);
  const displayName = state.profile?.full_name || state.profile?.email?.split('@')[0] || 'Client';
  const weeklyMeals = useMemo(() => buildWeeklyMeals(state.profile), [state.profile]);

  const forceRefreshIgnoringCache = async () => {
    return refresh(true);
  };

  return {
    loading: state.loading,
    syncing: state.syncing,
    error: state.error,
    profile: state.profile,
    summary,
    displayName,
    todayMeals: state.todayMeals,
    weeklyMeals,
    mealStatuses: state.mealStatuses,
    macro: state.macro,
    toggleMealStatus,
    swapMeal,
    saveCompetitionDate,
    addCustomSupplement,
    refresh,
    forceRefreshIgnoringCache,
  };
}
