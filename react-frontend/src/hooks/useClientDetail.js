import { useEffect, useMemo, useReducer, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/api';
import { hasDoctorAdminSession, resolveAuthRole, resolveAuthToken } from '../utils/authSession';
import { getStorage, safeGet, safeJsonGet, safeJsonSet } from '../utils/storageSafe';
import {
  WEEK_DAYS,
  buildInitialProgramsState,
  buildProgramsPayload,
  normalizeProgramsSource,
  programsReducer,
} from './useClientDetailReducer';
import { DEFAULT_DIET_PLANS } from '../data/defaultDietPlans';

function parseClientId(rawValue) {
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parsePositiveInt(rawValue) {
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function mapTeamPlayerToClient(player, teamId) {
  if (!player) return null;
  return {
    id: Number(player.client_id) || null,
    team_id: teamId,
    player_id: player.id || player.player_number || null,
    client_id: player.client_id || null,
    name: player.full_name || 'Client',
    full_name: player.full_name || 'Client',
    email: player.email || '',
    phone: player.phone || '',
    gender: player.gender || '',
    birthday: player.birthday || '',
    age: player.age || '',
    country: player.country || '',
    club: player.club || '',
    religion: player.religion || '',
    wake_up_time: player.wake_up_time || '',
    sleep_time: player.sleep_time || '',
    sport: player.sport || '',
    position: player.position || '',
    diet_schedule_type: player.diet_schedule_type || player.dietScheduleType || '',
    height: player.height || '',
    weight: player.weight || '',
    bmi: player.bmi || '',
    bmr: player.bmr || '',
    tdee: player.tdee || '',
    activity_level: player.activity_level || '',
    calories: player.calories || '',
    protein_target: player.protein_target || '',
    carbs_target: player.carbs_target || '',
    fats_target: player.fats_target || '',
    water_intake: player.water_intake || '',
    water_in_body: player.water_in_body || '',
    body_fat_percentage: player.body_fat_percentage || '',
    skeletal_muscle: player.skeletal_muscle || '',
    minerals: player.minerals || '',
    goal_weight: player.goal_weight || '',
    progression_type: player.progression_type || '',
    competition_status: player.competition_status || '',
    medical_notes: player.medical_notes || '',
    food_allergies: player.food_allergies || '',
    injuries: player.injuries || '',
    supplements: player.supplements || '',
    additionalNotes: player.additional_notes || '',
    mentalObservation: player.mental_notes || '',
    meal_swaps: null,
    created_source: 'team_player',
  };
}

function normalizeNotes(value) {
  const text = String(value || '').trim();
  if (!text || text === 'No notes added' || text === 'N/A') return '';
  return text;
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeTextOrNull(value) {
  const text = String(value || '').trim();
  return text ? text : null;
}

function normalizeDateOrNull(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function safeReadDietPlans(local) {
  try {
    const raw = safeGet(local, 'dietPlans');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) && parsed.length ? parsed : [...DEFAULT_DIET_PLANS];
  } catch {
    return [...DEFAULT_DIET_PLANS];
  }
}

function normalizeDietScheduleType(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'school' ? 'school' : 'summer';
}

function parseTdeeValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function selectRecommendedDietPlanIndex(plans = [], tdeeRaw, scheduleTypeRaw) {
  if (!Array.isArray(plans) || !plans.length) return null;
  const tdee = parseTdeeValue(tdeeRaw);
  if (!Number.isFinite(tdee)) return null;

  const scheduleType = normalizeDietScheduleType(scheduleTypeRaw);
  const bracket = tdee <= 1500 ? [0, 1500] : (tdee <= 2000 ? [1500, 2000] : [2000, 2500]);

  const exact = plans.findIndex((plan) => {
    const min = Number(plan?.minCalories);
    const max = Number(plan?.maxCalories);
    const type = String(plan?.dietType || '').toLowerCase();
    if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
    if (min !== bracket[0] || max !== bracket[1]) return false;
    return type.includes(scheduleType);
  });
  if (exact >= 0) return exact;

  const rangeOnly = plans.findIndex((plan) => {
    const min = Number(plan?.minCalories);
    const max = Number(plan?.maxCalories);
    return Number.isFinite(min) && Number.isFinite(max) && min === bracket[0] && max === bracket[1];
  });
  return rangeOnly >= 0 ? rangeOnly : null;
}

function countPlanMeals(plan = {}) {
  const planDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const mealKeys = ['breakfast', 'snack1', 'lunch', 'dinner', 'preworkout', 'postworkout'];
  let count = 0;
  planDays.forEach((day) => {
    const dayData = plan?.[day] || {};
    mealKeys.forEach((meal) => {
      const item = dayData?.[meal] || {};
      const hasText = String(item.en || '').trim() || String(item.ar || '').trim();
      if (hasText) count += 1;
    });
  });
  return count;
}

function mergePreferNonEmpty(base = {}, incoming = {}) {
  const next = { ...base };
  Object.entries(incoming || {}).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === 'string' && value.trim() === '') return;
    next[key] = value;
  });
  return next;
}

function syncClientCaches(local, clientId, updates = {}) {
  if (!clientId) return;
  const cacheKey = `clientData_${clientId}`;
  const dashboardKey = `clientDashboardCache_${clientId}`;
  const fullProfileKey = `clientFullProfile_${clientId}`;

  const existing = safeJsonGet(local, cacheKey, {}) || {};
  safeJsonSet(local, cacheKey, { ...existing, ...updates });

  const existingDashboard = safeJsonGet(local, dashboardKey, {}) || {};
  safeJsonSet(local, dashboardKey, { ...existingDashboard, ...updates });

  const existingFullProfile = safeJsonGet(local, fullProfileKey, {}) || {};
  safeJsonSet(local, fullProfileKey, { ...existingFullProfile, ...updates });
}

function getMealSwapsUpdatedAt(source) {
  if (!source || typeof source !== 'object') return 0;
  const value = Number(source.__updatedAt || source.updatedAt || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function resolveProgramsSource(mealSwaps, savedPrograms) {
  const backendSource = mealSwaps && mealSwaps.dayMeals ? mealSwaps : null;
  const localSource = savedPrograms && savedPrograms.dayMeals ? savedPrograms : null;
  if (!backendSource) return localSource;
  if (!localSource) return backendSource;

  const backendAt = getMealSwapsUpdatedAt(backendSource);
  const localAt = getMealSwapsUpdatedAt(localSource);

  // Prefer local when timestamps are missing or equal to avoid losing recent UI edits.
  if (localAt >= backendAt) return localSource;
  return backendSource;
}

function formatTrainingSessionTime(session, prefix) {
  if (!session || typeof session !== 'object') return '';
  const hourRaw = String(session?.[`${prefix}_hour`] || '').trim();
  const minRaw = String(session?.[`${prefix}_min`] || '').trim();
  const ampmRaw = String(session?.[`${prefix}_ampm`] || '').trim().toUpperCase();
  if (!hourRaw || !minRaw || !(ampmRaw === 'AM' || ampmRaw === 'PM')) return '';
  const hour = Number(hourRaw);
  const minute = Number(minRaw);
  if (!Number.isFinite(hour) || hour < 1 || hour > 12) return '';
  if (!Number.isFinite(minute) || minute < 0 || minute > 59) return '';
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampmRaw}`;
}

function parseSessionInfo(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    const parsed = JSON.parse(String(raw));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function resolveTrainingScheduleFromClient(client) {
  const sessions = Array.isArray(client?.training_sessions)
    ? client.training_sessions
    : (Array.isArray(client?.training_details) ? client.training_details : []);

  for (const item of sessions) {
    const normalized = parseSessionInfo(item?.session_info) || item;
    const start = formatTrainingSessionTime(normalized, 'start');
    const end = formatTrainingSessionTime(normalized, 'end');
    if (start || end) {
      return { start, end };
    }
  }

  return {
    start: client?.training_time || client?.training_start_time || client?.trainingTime || '',
    end: client?.training_end_time || client?.trainingEndTime || '',
  };
}

export function useClientDetail() {
  const local = getStorage('local');
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [client, setClient] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [programsState, dispatch] = useReducer(programsReducer, undefined, buildInitialProgramsState);
  const dietPlans = useMemo(() => safeReadDietPlans(local), [local]);
  const dietPlansWithSummary = useMemo(() => (
    dietPlans.map((plan, index) => ({
      index,
      plan,
      min: Number(plan?.minCalories || 0),
      max: Number(plan?.maxCalories || 0),
      dietType: String(plan?.dietType || 'No type specified'),
      mealsCount: countPlanMeals(plan),
    }))
  ), [dietPlans]);
  const teamId = parsePositiveInt(searchParams.get('team_id'));
  const playerId = parsePositiveInt(searchParams.get('player_id'));
  const isAdminUser = String(resolveAuthRole() || '').toLowerCase() === 'admin';

  const selectedClientId = useMemo(() => {
    const explicitId = parseClientId(searchParams.get('id'));
    if (explicitId) return explicitId;

    // When opening via Team View, do not use stale locally remembered client id.
    const teamParam = parsePositiveInt(searchParams.get('team_id'));
    const playerParam = parsePositiveInt(searchParams.get('player_id'));
    if (teamParam && playerParam) return null;

    return parseClientId(safeGet(local, 'currentClientId'));
  }, [searchParams]);
  const detailStorageKey = selectedClientId ? `clientDetail_${selectedClientId}` : (teamId && playerId ? `teamPlayerDetail_${teamId}_${playerId}` : '');

  useEffect(() => {
    let mounted = true;

    async function loadClient() {
      setLoading(true);
      setError('');
      setMessage('');

      try {
        let resolvedClient = null;
        const token = resolveAuthToken();
        const role = String(resolveAuthRole() || '').toLowerCase();
        const doctorSession = hasDoctorAdminSession();
        const canUseAdminDetail = Boolean(
          token && (
            role === 'admin' ||
            (role === 'doctor' && doctorSession)
          )
        );

        // Always hydrate from team player when route includes team/player ids.
        // This ensures player-form fields (body fat, skeletal muscle, water in body,
        // minerals, goal/progression/competition, medical notes) appear in Client Detail.
        if (teamId && playerId) {
          try {
            const teamResponse = await apiClient.get(`/api/teams/${encodeURIComponent(teamId)}`);
            const players = Array.isArray(teamResponse?.data?.players) ? teamResponse.data.players : [];
            const matched = players.find((item) => Number(item?.id) === Number(playerId) || Number(item?.player_number) === Number(playerId));
            resolvedClient = mapTeamPlayerToClient(matched, teamId);
          } catch {
            // Continue with other fallbacks.
          }
        }

        if (selectedClientId && canUseAdminDetail) {
          try {
            const clientResponse = await apiClient.get(`/api/admin/clients/${selectedClientId}`);
            const adminClient = clientResponse?.data || null;
            resolvedClient = resolvedClient ? { ...adminClient, ...resolvedClient } : adminClient;
          } catch {
            // Fallback to local cache.
          }
        }

        if (!resolvedClient && selectedClientId) {
          const clients = safeJsonGet(local, 'clients', []);
          resolvedClient = clients.find((item) => Number(item?.id) === Number(selectedClientId)) || null;
        }

        // Merge nutrition profile fields so measurement/goals/health fields are available.
        if (resolvedClient && selectedClientId && canUseAdminDetail) {
          try {
            const nutritionResponse = await apiClient.get(`/api/admin/clients/${selectedClientId}/nutrition`);
            const nutritionClient = nutritionResponse?.data || {};
            // Keep existing identity fields and fill/refresh with non-empty nutrition values.
            resolvedClient = mergePreferNonEmpty(resolvedClient, nutritionClient);
          } catch {
            // Keep base profile if nutrition endpoint is not available.
          }
        }

        if (selectedClientId) {
          const clientCache = safeJsonGet(local, `clientData_${selectedClientId}`, null);
          if (clientCache && typeof clientCache === 'object') {
            resolvedClient = mergePreferNonEmpty(resolvedClient || {}, clientCache);
          }
        }

        if (!resolvedClient) {
          throw new Error('No client selected.');
        }

        // Re-apply last locally edited values for both clients and team players.
        if (detailStorageKey) {
          const localDetail = safeJsonGet(local, detailStorageKey, null);
          if (localDetail && typeof localDetail === 'object') {
            resolvedClient = { ...resolvedClient, ...localDetail };
          }
        }

        if (!mounted) return;

        setClient(resolvedClient);
        const trainingSchedule = resolveTrainingScheduleFromClient(resolvedClient);

        const programsKey = selectedClientId ? `clientPrograms_${selectedClientId}` : '';
        const savedPrograms = programsKey ? safeJsonGet(local, programsKey, null) : null;
        const mealSwaps = resolvedClient.meal_swaps || null;
        const source = resolveProgramsSource(mealSwaps, savedPrograms);

        const normalizedPrograms = normalizeProgramsSource(source, resolvedClient);
        dispatch({
          type: 'INIT_FROM_SOURCE',
          payload: normalizedPrograms,
        });
        dispatch({
          type: 'RECOMPUTE_MEAL_TIMES',
          payload: {
            scheduleContext: {
              wakeUpTime: resolvedClient?.wake_up_time || resolvedClient?.wakeUpTime,
              trainingTime: trainingSchedule.start,
              trainingEndTime: trainingSchedule.end,
            },
          },
        });

        const hasManualSelection = Number.isInteger(normalizedPrograms?.selectedPlanIndex);
        if (!hasManualSelection) {
          const recommendedPlanIndex = selectRecommendedDietPlanIndex(
            dietPlans,
            resolvedClient?.tdee,
            resolvedClient?.diet_schedule_type || resolvedClient?.dietScheduleType
          );

          if (Number.isInteger(recommendedPlanIndex) && dietPlans[recommendedPlanIndex]) {
            dispatch({
              type: 'APPLY_DIET_PLAN',
              payload: {
                selectedPlanIndex: recommendedPlanIndex,
                plan: dietPlans[recommendedPlanIndex],
                scheduleContext: {
                  wakeUpTime: resolvedClient?.wake_up_time || resolvedClient?.wakeUpTime,
                  trainingTime: trainingSchedule.start,
                  trainingEndTime: trainingSchedule.end,
                },
              },
            });

            if (programsKey) {
              const existingPrograms = safeJsonGet(local, programsKey, {}) || {};
              safeJsonSet(local, programsKey, {
                ...existingPrograms,
                __updatedAt: Date.now(),
                selectedPlanIndex: recommendedPlanIndex,
              });
            }
          }
        }
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load client details.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadClient();
    return () => {
      mounted = false;
    };
  }, [selectedClientId, teamId, playerId, dietPlans]);

  const updateProgramField = (field, value) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { field, value } });
  };

  const updateNotes = (value) => {
    dispatch({ type: 'UPDATE_NOTES', payload: value });
  };

  const addMeal = () => {
    dispatch({ type: 'ADD_MEAL', payload: { dayName: selectedDay } });
  };

  const updateMeal = (mealId, field, value) => {
    dispatch({ type: 'UPDATE_MEAL', payload: { dayName: selectedDay, mealId, field, value } });
  };

  const moveMealUp = (mealId) => {
    dispatch({ type: 'MOVE_MEAL_UP', payload: { dayName: selectedDay, mealId } });
  };

  const moveMealDown = (mealId) => {
    dispatch({ type: 'MOVE_MEAL_DOWN', payload: { dayName: selectedDay, mealId } });
  };

  const deleteMeal = (mealId) => {
    dispatch({ type: 'REMOVE_MEAL', payload: { dayName: selectedDay, mealId } });
  };

  const applyDietPlan = (planIndex) => {
    const selectedPlan = dietPlans[planIndex];
    if (!selectedPlan) return false;
    const trainingSchedule = resolveTrainingScheduleFromClient(client);
    dispatch({
      type: 'APPLY_DIET_PLAN',
      payload: {
        selectedPlanIndex: planIndex,
        plan: selectedPlan,
        scheduleContext: {
          wakeUpTime: client?.wake_up_time || client?.wakeUpTime,
          trainingTime: trainingSchedule.start,
          trainingEndTime: trainingSchedule.end,
        },
      },
    });

    if (selectedClientId) {
      const programsKey = `clientPrograms_${selectedClientId}`;
      const existingPrograms = safeJsonGet(local, programsKey, {}) || {};
      safeJsonSet(local, programsKey, {
        ...existingPrograms,
        __updatedAt: Date.now(),
        selectedPlanIndex: planIndex,
      });
    }

    setMessage('Diet plan applied to weekly meal plan. Save Programs to persist.');
    return true;
  };

  const saveNotes = async (event) => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    if (!client || !selectedClientId) return false;

    setSaving(true);
    setError('');
    setMessage('');

    const {
      notesText,
      personalNotesText,
      mentalText,
      supplementsText,
      competitionStatus,
      mealSwapsPayload,
    } =
      buildProgramsPayload(programsState);
    const resolvedPersonalNotes = isAdminUser
      ? personalNotesText
      : normalizeNotes(client.personal_notes || client.personalNotes || client.additional_notes || client.additionalNotes);

    try {
      const updated = {
        ...client,
        notes: notesText || 'No notes added',
        personal_notes: resolvedPersonalNotes || '',
        personalNotes: resolvedPersonalNotes || '',
        additional_notes: resolvedPersonalNotes || '',
        additionalNotes: resolvedPersonalNotes || '',
        mentalObservation: mentalText || 'No mental observations',
        supplements: supplementsText || 'No supplements added',
        meal_swaps: mealSwapsPayload,
      };
      setClient(updated);

      const clients = safeJsonGet(local, 'clients', []);
      const idx = clients.findIndex((item) => Number(item?.id) === Number(selectedClientId));
      if (idx >= 0) {
        clients[idx] = {
          ...clients[idx],
          notes: updated.notes,
          personal_notes: updated.personal_notes,
          personalNotes: updated.personalNotes,
          additional_notes: updated.additional_notes,
          additionalNotes: updated.additionalNotes,
          mentalObservation: updated.mentalObservation,
          supplements: updated.supplements,
          meal_swaps: mealSwapsPayload,
        };
        safeJsonSet(local, 'clients', clients);
      }

      const programsKey = selectedClientId ? `clientPrograms_${selectedClientId}` : '';
      if (programsKey) safeJsonSet(local, programsKey, mealSwapsPayload);
      syncClientCaches(local, selectedClientId, {
        notes: updated.notes,
        personal_notes: updated.personal_notes,
        personalNotes: updated.personalNotes,
        additional_notes: updated.additional_notes,
        additionalNotes: updated.additionalNotes,
        mentalObservation: updated.mentalObservation,
        supplements: updated.supplements,
        meal_swaps: mealSwapsPayload,
      });

        if (resolveAuthToken() && selectedClientId) {
        try {
          await apiClient.put(`/api/admin/clients/${selectedClientId}`, {
            ...(isAdminUser ? { additional_notes: updated.additionalNotes } : {}),
            mental_observation: updated.mentalObservation,
            supplements: updated.supplements,
            competition_enabled: Boolean(programsState.programFields.competitionEnabled),
            competition_status: competitionStatus || null,
            meal_swaps: mealSwapsPayload,
          });
        } catch {
          // Keep local success as baseline even when backend save is unavailable.
        }
      }

      setMessage('Programs and meal plan saved successfully.');
      return true;
    } catch (err) {
      setError(err?.message || 'Failed to save notes.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveDetailFields = async (updates = {}) => {
    if (!client) return false;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const merged = { ...client, ...updates };
      setClient(merged);

      if (detailStorageKey) {
        safeJsonSet(local, detailStorageKey, updates);
      }

      syncClientCaches(local, selectedClientId, updates);

      if (selectedClientId) {
        const clients = safeJsonGet(local, 'clients', []);
        const idx = clients.findIndex((item) => Number(item?.id) === Number(selectedClientId));
        if (idx >= 0) {
          clients[idx] = { ...clients[idx], ...updates };
          safeJsonSet(local, 'clients', clients);
        }

        if (resolveAuthToken()) {
          try {
            await apiClient.put(`/api/admin/clients/${selectedClientId}`, {
              birthday: normalizeDateOrNull(merged.birthday),
              gender: normalizeTextOrNull(merged.gender),
              club: normalizeTextOrNull(merged.club),
              country: normalizeTextOrNull(merged.country),
              religion: normalizeTextOrNull(merged.religion),
              wake_up_time: normalizeTextOrNull(merged.wake_up_time || merged.wakeUpTime),
              sleep_time: normalizeTextOrNull(merged.sleep_time || merged.sleepTime),
              height: toNullableNumber(merged.height),
              weight: toNullableNumber(merged.weight),
              bmi: toNullableNumber(merged.bmi),
              bmr: toNullableNumber(merged.bmr),
              tdee: toNullableNumber(merged.tdee),
              activity_level: normalizeTextOrNull(merged.activity_level),
              sport: normalizeTextOrNull(merged.sport),
              position: normalizeTextOrNull(merged.position),
              mental_observation: normalizeTextOrNull(merged.mental_observation || merged.mentalObservation),
            });

            await apiClient.put(`/api/admin/clients/${selectedClientId}/nutrition`, {
              body_fat_percentage: toNullableNumber(merged.body_fat_percentage),
              skeletal_muscle: toNullableNumber(merged.skeletal_muscle),
              water_in_body: toNullableNumber(merged.water_in_body),
              minerals: toNullableNumber(merged.minerals),
              bmi: toNullableNumber(merged.bmi),
              bmr: toNullableNumber(merged.bmr),
              tdee: toNullableNumber(merged.tdee),
              activity_level: normalizeTextOrNull(merged.activity_level),
              sport: normalizeTextOrNull(merged.sport),
              position: normalizeTextOrNull(merged.position),
              calories: toNullableNumber(merged.calories),
              goal_weight: toNullableNumber(merged.goal_weight),
              progression_type: normalizeTextOrNull(merged.progression_type),
              competition_status: normalizeTextOrNull(merged.competition_status),
              medical_notes: normalizeTextOrNull(merged.medical_notes),
              injuries: normalizeTextOrNull(merged.injuries),
              food_allergies: normalizeTextOrNull(merged.food_allergies),
              mental_notes: normalizeTextOrNull(merged.mental_observation || merged.mentalObservation),
            });
          } catch {
            // Keep local persistence even if backend save is unavailable.
          }
        }
      }

      setMessage('Client details saved successfully.');
      return true;
    } catch (err) {
      setError(err?.message || 'Failed to save client details.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    selectedClientId,
    loading,
    saving,
    error,
    message,
    client,
    weekDays: WEEK_DAYS,
    selectedDay,
    setSelectedDay,
    programsState,
    canEditDietPlanSelection: isAdminUser,
    canEditAdminPersonalNotes: isAdminUser,
    selectedDietScheduleType: normalizeDietScheduleType(client?.diet_schedule_type || client?.dietScheduleType),
    dietPlansWithSummary,
    updateNotes,
    updateProgramField,
    applyDietPlan,
    addMeal,
    updateMeal,
    moveMealUp,
    moveMealDown,
    deleteMeal,
    saveNotes,
    saveDetailFields,
  };
}
