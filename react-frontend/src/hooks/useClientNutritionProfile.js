import { useEffect, useMemo, useReducer } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/api';
import { usePersistentDraft } from './usePersistentDraft';
import { getStorage, safeJsonGet, safeJsonSet } from '../utils/storageSafe';
import { clearSessionAuth, hasDoctorAdminSession, resolveAuthRole, resolveAuthToken } from '../utils/authSession';

const DEFAULT_ACTIVITY = 'extremely_active';
const DEFAULT_COMPETITION = 'none';
const DEFAULT_PROGRESSION = 'maintain';
const DAYS = ['Mo', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function buildNutritionDraftKey(clientId) {
  return `nutritionProfileAutofillV1_${clientId || 'default'}`;
}

export function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toInputValue(value) {
  return value === null || value === undefined ? '' : String(value);
}

function normalizeDietScheduleType(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'school' ? 'school' : 'summer';
}

export function getCaloriesLabel(progressionType) {
  if (progressionType === 'cut') return 'Cut Calories';
  if (progressionType === 'maintain') return 'Maintain Calories';
  if (progressionType === 'bulk') return 'Bulk Calories';
  return 'Calories';
}

export function calculateNutritionDerived(fields) {
  const height = toNumberOrNull(fields.height);
  const weight = toNumberOrNull(fields.weight);
  const bodyFat = toNumberOrNull(fields.bodyFat);
  const skeletalMuscle = toNumberOrNull(fields.skeletalMuscle);

  const next = { ...fields };

  const bmi = height && weight && height > 0 ? weight / Math.pow(height / 100, 2) : null;
  next.bmi = bmi !== null ? bmi.toFixed(1) : '';

  const bodyFatMass = weight !== null && bodyFat !== null ? (weight * bodyFat) / 100 : null;
  next.bodyFatMass = bodyFatMass !== null ? bodyFatMass.toFixed(1) : '';

  const musclePercent = weight && skeletalMuscle !== null && weight > 0 ? (skeletalMuscle / weight) * 100 : null;
  next.musclePercent = musclePercent !== null ? musclePercent.toFixed(1) : '';

  const bmr = height && weight ? 10 * weight + 6.25 * height - 120 + 5 : null;
  next.bmr = bmr !== null ? bmr.toFixed(1) : '';

  const factors = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  };
  const factor = factors[fields.activityLevel] || 1.9;
  const tdee = bmr !== null ? bmr * factor : null;
  next.tdee = tdee !== null ? tdee.toFixed(1) : '';

  let calories = null;
  if (tdee !== null) {
    if (fields.progressionType === 'cut') calories = tdee - 500;
    if (fields.progressionType === 'maintain') calories = tdee;
    if (fields.progressionType === 'bulk') calories = tdee + 500;
  }
  next.calories = calories !== null ? calories.toFixed(1) : '';

  if (calories !== null) {
    const protein = (weight || 0) * 2;
    const fats = (weight || 0) * 0.8;
    const carbs = Math.max((calories - (protein * 4 + fats * 9)) / 4, 0);
    next.protein = protein ? protein.toFixed(1) : '';
    next.fats = fats ? fats.toFixed(1) : '';
    next.carbs = carbs ? carbs.toFixed(1) : '';
  } else {
    next.protein = '';
    next.fats = '';
    next.carbs = '';
  }

  const waterIntake = weight ? weight * 0.035 : null;
  next.waterIntake = waterIntake !== null ? waterIntake.toFixed(1) : '';

  if (fields.competitionDate) {
    const now = new Date();
    const target = new Date(fields.competitionDate);
    const days = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    next.daysLeft = Number.isFinite(days) ? String(Math.max(days, 0)) : '';
  } else {
    next.daysLeft = '';
  }

  return next;
}

function buildTrainingSession(seed = {}) {
  const days = Array.isArray(seed.days) ? seed.days : [];
  return {
    name: String(seed.name || seed.session || ''),
    type: String(seed.type || 'low'),
    days,
    startHour: String(seed.start_hour || '12'),
    startMin: String(seed.start_min || '00'),
    startAmPm: String(seed.start_ampm || 'AM'),
    endHour: String(seed.end_hour || '12'),
    endMin: String(seed.end_min || '00'),
    endAmPm: String(seed.end_ampm || 'PM'),
  };
}

function buildSupplement(seed = {}) {
  return {
    name: String(seed.name || ''),
    amount: seed.amount === null || seed.amount === undefined ? '' : String(seed.amount),
    notes: String(seed.notes || ''),
  };
}

export function buildNutritionFallbackDraft() {
  return {
    fields: {
      height: '178',
      weight: '78',
      bodyFat: '14',
      skeletalMuscle: '35',
      activityLevel: 'very_active',
      sport: 'Football',
      position: 'Midfielder',
      progressionType: 'maintain',
      waterInBody: '41',
      minerals: '3.6',
      testRecord: 'Initial assessment completed.',
      injuries: 'No current injuries.',
      mentalNotes: 'Focused and motivated.',
      foodAllergies: 'None',
      medicalNotes: 'No chronic conditions reported.',
      foodLikes: 'Rice, chicken, vegetables',
      foodDislikes: 'Deep fried foods',
      wakeUpTime: '07:00',
      sleepTime: '22:30',
      dietScheduleType: 'summer',
      competition: 'none',
      competitionDate: '',
      goalWeight: '76',
      additionalNotes: 'Follow-up in 2 weeks.',
    },
    trainingSessions: [
      buildTrainingSession({
        name: 'Training Session 1',
        type: 'low',
        days: ['Mo', 'Wed', 'Fri'],
        start_hour: '06',
        start_min: '00',
        start_ampm: 'PM',
        end_hour: '08',
        end_min: '00',
        end_ampm: 'PM',
      }),
    ],
    supplements: [
      buildSupplement({
        name: 'Supplement 1',
        amount: 20,
        notes: 'Post workout',
      }),
    ],
  };
}

export function buildNutritionFields(seed = {}) {
  const base = {
    height: '',
    weight: '',
    bmi: '',
    bodyFat: '',
    skeletalMuscle: '',
    bodyFatMass: '',
    musclePercent: '',
    bmr: '',
    activityLevel: DEFAULT_ACTIVITY,
    sport: '',
    position: '',
    tdee: '',
    progressionType: DEFAULT_PROGRESSION,
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    waterInBody: '',
    waterIntake: '',
    minerals: '',
    testRecord: '',
    injuries: '',
    mentalNotes: '',
    foodAllergies: '',
    medicalNotes: '',
    foodLikes: '',
    foodDislikes: '',
    wakeUpTime: '',
    sleepTime: '',
    dietScheduleType: 'summer',
    competition: DEFAULT_COMPETITION,
    competitionDate: '',
    daysLeft: '',
    goalWeight: '',
    additionalNotes: '',
  };

  const merged = Object.fromEntries(
    Object.keys(base).map((key) => [key, toInputValue(seed[key] ?? base[key])])
  );

  return calculateNutritionDerived(merged);
}

function buildEmptyDraftSnapshot() {
  return {
    fields: buildNutritionFields(),
    trainingSessions: [],
    supplements: [],
  };
}

function mapApiNutritionToState(data = {}) {
  const trainingSource = Array.isArray(data.training_sessions)
    ? data.training_sessions
    : (Array.isArray(data.training_details) ? data.training_details : []);

  let supplementsSource = [];
  if (Array.isArray(data.supplements)) {
    supplementsSource = data.supplements;
  } else if (typeof data.supplements === 'string' && data.supplements.trim()) {
    try {
      const parsed = JSON.parse(data.supplements);
      if (Array.isArray(parsed)) {
        supplementsSource = parsed;
      } else {
        supplementsSource = [{ name: '', amount: '', notes: data.supplements }];
      }
    } catch {
      supplementsSource = [{ name: '', amount: '', notes: data.supplements }];
    }
  }

  return {
    fields: buildNutritionFields({
      height: data.height,
      weight: data.weight,
      bmi: data.bmi,
      bodyFat: data.body_fat_percentage,
      skeletalMuscle: data.skeletal_muscle,
      bodyFatMass: data.body_fat_mass,
      musclePercent: data.muscle_percentage,
      bmr: data.bmr,
      activityLevel: data.activity_level || DEFAULT_ACTIVITY,
      sport: data.sport,
      position: data.position,
      tdee: data.tdee,
      progressionType: data.progression_type || DEFAULT_PROGRESSION,
      calories: data.calories,
      protein: data.protein_target,
      carbs: data.carbs_target,
      fats: data.fats_target,
      waterInBody: data.water_in_body ?? data.water_percentage,
      waterIntake: data.water_intake,
      minerals: data.minerals,
      testRecord: data.test_record_notes,
      injuries: data.injuries,
      mentalNotes: data.mental_notes ?? data.mental_observation,
      foodAllergies: data.food_allergies,
      medicalNotes: data.medical_notes ?? data.medical,
      foodLikes: data.food_likes,
      foodDislikes: data.food_dislikes,
      wakeUpTime: data.wake_up_time || data.wakeUpTime,
      sleepTime: data.sleep_time || data.sleepTime,
      dietScheduleType: normalizeDietScheduleType(data.diet_schedule_type || data.schedule_type || data.plan_type),
      competition: data.competition_status || DEFAULT_COMPETITION,
      competitionDate: data.competition_date,
      daysLeft: data.days_left,
      goalWeight: data.goal_weight,
      additionalNotes: data.additional_notes,
    }),
    trainingSessions: trainingSource.map((item) => buildTrainingSession(item)),
    supplements: supplementsSource.map((item) => buildSupplement(item)),
  };
}

function normalizeDraftSnapshot(rawDraft) {
  if (!rawDraft || typeof rawDraft !== 'object') {
    return buildEmptyDraftSnapshot();
  }

  if (rawDraft.fields) {
    return {
      fields: rawDraft.fields,
      trainingSessions: Array.isArray(rawDraft.trainingSessions)
        ? rawDraft.trainingSessions
        : (Array.isArray(rawDraft.training_sessions) ? rawDraft.training_sessions.map((item) => buildTrainingSession(item)) : []),
      supplements: Array.isArray(rawDraft.supplements)
        ? rawDraft.supplements
        : [],
    };
  }

  return {
    fields: rawDraft,
    trainingSessions: Array.isArray(rawDraft.training_sessions)
      ? rawDraft.training_sessions.map((item) => buildTrainingSession(item))
      : [],
    supplements: Array.isArray(rawDraft.supplements)
      ? rawDraft.supplements.map((item) => buildSupplement(item))
      : [],
  };
}

function hasMeaningfulServerNutritionData(data = {}) {
  const keys = [
    'height',
    'weight',
    'tdee',
    'goal_weight',
    'protein_target',
    'carbs_target',
    'fats_target',
    'competition_date',
    'activity_level',
    'sport',
    'position',
  ];

  return keys.some((key) => {
    const value = data?.[key];
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return Number.isFinite(value) && value !== 0;
    return true;
  });
}

export function buildNutritionPayload({ fields, trainingSessions, supplements }) {
  return {
    height: toNumberOrNull(fields.height),
    weight: toNumberOrNull(fields.weight),
    bmi: toNumberOrNull(fields.bmi),
    body_fat_percentage: toNumberOrNull(fields.bodyFat),
    skeletal_muscle: toNumberOrNull(fields.skeletalMuscle),
    body_fat_mass: toNumberOrNull(fields.bodyFatMass),
    muscle_percentage: toNumberOrNull(fields.musclePercent),
    bmr: toNumberOrNull(fields.bmr),
    activity_level: fields.activityLevel || null,
    sport: fields.sport || null,
    position: fields.position || null,
    tdee: toNumberOrNull(fields.tdee),
    progression_type: fields.progressionType || null,
    calories: toNumberOrNull(fields.calories),
    protein_target: toNumberOrNull(fields.protein),
    carbs_target: toNumberOrNull(fields.carbs),
    fats_target: toNumberOrNull(fields.fats),
    water_in_body: toNumberOrNull(fields.waterInBody),
    water_intake: toNumberOrNull(fields.waterIntake),
    minerals: toNumberOrNull(fields.minerals),
    test_record_notes: fields.testRecord || null,
    injuries: fields.injuries || null,
    mental_notes: fields.mentalNotes || null,
    food_allergies: fields.foodAllergies || null,
    medical_notes: fields.medicalNotes || null,
    food_likes: fields.foodLikes || null,
    food_dislikes: fields.foodDislikes || null,
    wake_up_time: fields.wakeUpTime || null,
    sleep_time: fields.sleepTime || null,
    diet_schedule_type: normalizeDietScheduleType(fields.dietScheduleType),
    competition_status: fields.competition || DEFAULT_COMPETITION,
    competition_date: fields.competitionDate || null,
    days_left: toNumberOrNull(fields.daysLeft),
    goal_weight: toNumberOrNull(fields.goalWeight),
    additional_notes: fields.additionalNotes || null,
    training_sessions: trainingSessions
      .map((item) => ({
        name: String(item.name || '').trim(),
        session: String(item.name || '').trim(),
        type: item.type,
        days: Array.isArray(item.days) ? item.days : [],
        start_hour: item.startHour,
        start_min: item.startMin,
        start_ampm: item.startAmPm,
        end_hour: item.endHour,
        end_min: item.endMin,
        end_ampm: item.endAmPm,
      }))
      .filter((item) => item.name || item.days.length > 0),
    supplements: supplements
      .map((item) => ({
        name: String(item.name || '').trim(),
        amount: toNumberOrNull(item.amount),
        notes: String(item.notes || '').trim(),
      }))
      .filter((item) => item.name || item.notes || item.amount !== null),
  };
}

function buildClientProfileNutritionPayload({ fields, trainingSessions, supplements }) {
  const normalizedSupplements = supplements
    .map((item) => ({
      name: String(item.name || '').trim(),
      amount: toNumberOrNull(item.amount),
      notes: String(item.notes || '').trim(),
    }))
    .filter((item) => item.name || item.notes || item.amount !== null);

  return {
    height: toNumberOrNull(fields.height),
    weight: toNumberOrNull(fields.weight),
    bmi: toNumberOrNull(fields.bmi),
    body_fat_percentage: toNumberOrNull(fields.bodyFat),
    skeletal_muscle: toNumberOrNull(fields.skeletalMuscle),
    body_fat_mass: toNumberOrNull(fields.bodyFatMass),
    muscle_percentage: toNumberOrNull(fields.musclePercent),
    bmr: toNumberOrNull(fields.bmr),
    activity_level: fields.activityLevel || null,
    sport: fields.sport || null,
    position: fields.position || null,
    tdee: toNumberOrNull(fields.tdee),
    progression_type: fields.progressionType || null,
    protein_target: toNumberOrNull(fields.protein),
    carbs_target: toNumberOrNull(fields.carbs),
    fats_target: toNumberOrNull(fields.fats),
    water_percentage: toNumberOrNull(fields.waterInBody),
    water_intake: toNumberOrNull(fields.waterIntake),
    minerals: toNumberOrNull(fields.minerals),
    test_record_notes: fields.testRecord || null,
    injuries: fields.injuries || null,
    mental_observation: fields.mentalNotes || null,
    medical: fields.medicalNotes || null,
    food_allergies: fields.foodAllergies || null,
    food_likes: fields.foodLikes || null,
    food_dislikes: fields.foodDislikes || null,
    wake_up_time: fields.wakeUpTime || null,
    sleep_time: fields.sleepTime || null,
    diet_schedule_type: normalizeDietScheduleType(fields.dietScheduleType),
    competition_status: fields.competition || DEFAULT_COMPETITION,
    competition_date: fields.competitionDate || null,
    days_left: toNumberOrNull(fields.daysLeft),
    goal_weight: toNumberOrNull(fields.goalWeight),
    additional_notes: fields.additionalNotes || null,
    training_details: trainingSessions
      .map((item) => ({
        name: String(item.name || '').trim(),
        session: String(item.name || '').trim(),
        type: item.type,
        days: Array.isArray(item.days) ? item.days : [],
        start_hour: item.startHour,
        start_min: item.startMin,
        start_ampm: item.startAmPm,
        end_hour: item.endHour,
        end_min: item.endMin,
        end_ampm: item.endAmPm,
      }))
      .filter((item) => item.name || item.days.length > 0),
    supplements: normalizedSupplements.length ? JSON.stringify(normalizedSupplements) : null,
  };
}

export function buildClientNutritionProfileInitialState() {
  return {
    loading: true,
    saving: false,
    error: '',
    success: '',
    clientId: '',
    fields: buildNutritionFields(),
    trainingSessions: [],
    supplements: [],
  };
}

export function clientNutritionProfileReducer(state, action) {
  switch (action.type) {
    case 'SET_CLIENT':
      return { ...state, clientId: action.payload };
    case 'LOAD_START':
      return { ...state, loading: true, error: '', success: '' };
    case 'LOAD_DONE':
      return { ...state, loading: false };
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'LOAD_SUCCESS':
      return {
        ...state,
        loading: false,
        error: '',
        success: '',
        fields: action.payload.fields,
        trainingSessions: action.payload.trainingSessions,
        supplements: action.payload.supplements,
      };
    case 'SET_FIELD': {
      const nextFields = calculateNutritionDerived({
        ...state.fields,
        [action.payload.field]: action.payload.value,
      });
      return { ...state, fields: nextFields, success: '' };
    }
    case 'ADD_TRAINING':
      return {
        ...state,
        trainingSessions: [...state.trainingSessions, buildTrainingSession({})],
        success: '',
      };
    case 'REMOVE_TRAINING':
      return {
        ...state,
        trainingSessions: state.trainingSessions.filter((_, index) => index !== action.payload),
        success: '',
      };
    case 'UPDATE_TRAINING': {
      const { index, field, value } = action.payload;
      return {
        ...state,
        trainingSessions: state.trainingSessions.map((item, idx) => {
          if (idx !== index) return item;
          return { ...item, [field]: value };
        }),
        success: '',
      };
    }
    case 'TOGGLE_TRAINING_DAY': {
      const { index, day } = action.payload;
      return {
        ...state,
        trainingSessions: state.trainingSessions.map((item, idx) => {
          if (idx !== index) return item;
          const exists = item.days.includes(day);
          return {
            ...item,
            days: exists ? item.days.filter((entry) => entry !== day) : [...item.days, day],
          };
        }),
        success: '',
      };
    }
    case 'ADD_SUPPLEMENT':
      return {
        ...state,
        supplements: [...state.supplements, buildSupplement({ amount: '' })],
        success: '',
      };
    case 'REMOVE_SUPPLEMENT':
      return {
        ...state,
        supplements: state.supplements.filter((_, index) => index !== action.payload),
        success: '',
      };
    case 'UPDATE_SUPPLEMENT': {
      const { index, field, value } = action.payload;
      return {
        ...state,
        supplements: state.supplements.map((item, idx) => {
          if (idx !== index) return item;
          return { ...item, [field]: value };
        }),
        success: '',
      };
    }
    case 'AUTOFILL': {
      const nextDraft = buildNutritionFallbackDraft();
      return {
        ...state,
        fields: calculateNutritionDerived({ ...state.fields, ...nextDraft.fields }),
        trainingSessions: nextDraft.trainingSessions,
        supplements: nextDraft.supplements,
        success: 'Autofill completed for nutrition profile fields.',
      };
    }
    case 'SAVE_START':
      return { ...state, saving: true, error: '', success: '' };
    case 'SAVE_SUCCESS':
      return { ...state, saving: false, error: '', success: action.payload };
    case 'SAVE_ERROR':
      return { ...state, saving: false, error: action.payload, success: '' };
    case 'RESTORE_DRAFT':
      return {
        ...state,
        fields: buildNutritionFields(action.payload.fields),
        trainingSessions: action.payload.trainingSessions,
        supplements: action.payload.supplements,
        success: 'Saved draft restored.',
      };
    default:
      return state;
  }
}

function extractApiError(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }
  return fallback;
}

export function useClientNutritionProfile() {
  const navigate = useNavigate();
  const local = getStorage('local');
  const [searchParams] = useSearchParams();
  const [state, dispatch] = useReducer(
    clientNutritionProfileReducer,
    undefined,
    buildClientNutritionProfileInitialState
  );

  const clientId = searchParams.get('client_id') || '';
  const flow = String(searchParams.get('flow') || localStorage.getItem('onboardingSource') || '').toLowerCase();
  const authToken = resolveAuthToken();
  const authRole = String(resolveAuthRole() || '').toLowerCase();
  const hasDoctorSession = hasDoctorAdminSession();
  const isClientSession = Boolean(authToken && authRole === 'client');
  const canUseNutritionApi = Boolean(
    authToken && (
      authRole === 'admin' ||
      (authRole === 'doctor' && hasDoctorSession) ||
      authRole === 'client'
    )
  );
  const requiresClientId = authRole === 'admin' || authRole === 'doctor';
  const clientIdForState = clientId || (isClientSession ? 'self' : '');
  const draftKey = useMemo(() => buildNutritionDraftKey(clientIdForState), [clientIdForState]);
  const {
    draft,
    setDraft,
    clearDraft,
    hasDraft,
  } = usePersistentDraft({ key: draftKey, initialValue: null, enabled: Boolean(clientIdForState) });

  useEffect(() => {
    dispatch({ type: 'SET_CLIENT', payload: clientIdForState });
  }, [clientIdForState]);

  useEffect(() => {
    if (requiresClientId && !clientId) {
      dispatch({ type: 'LOAD_ERROR', payload: 'Missing client id.' });
      return;
    }

    if (!canUseNutritionApi) {
      dispatch({
        type: 'LOAD_ERROR',
        payload: 'Client, Doctor, or Admin login is required to open and save Nutrition Profile. Please sign in and try again.',
      });
      return;
    }

    let mounted = true;

    const load = async () => {
      dispatch({ type: 'LOAD_START' });
      const localDraft = normalizeDraftSnapshot(draft);
      const cachedClientData = safeJsonGet(local, `clientData_${clientId || 'self'}`, {}) || {};
      const endpoint = isClientSession
        ? '/api/client/profile'
        : `/api/admin/clients/${encodeURIComponent(clientId)}/nutrition`;

      try {
        const response = await apiClient.get(endpoint);
        if (!mounted) return;

        const serverData = response?.data || {};
        const mapped = mapApiNutritionToState(serverData);
        const useServerFields = hasMeaningfulServerNutritionData(serverData);
        const normalized = {
          fields: buildNutritionFields({
            ...(useServerFields ? mapped.fields : localDraft.fields),
            dietScheduleType:
              mapped.fields?.dietScheduleType ||
              localDraft.fields?.dietScheduleType ||
              cachedClientData.diet_schedule_type ||
              cachedClientData.dietScheduleType ||
              'summer',
          }),
          trainingSessions: mapped.trainingSessions.length ? mapped.trainingSessions : localDraft.trainingSessions,
          supplements: mapped.supplements.length ? mapped.supplements : localDraft.supplements,
        };
        dispatch({ type: 'LOAD_SUCCESS', payload: normalized });
      } catch (error) {
        if (!mounted) return;

        if (error?.response?.status === 401) {
          clearSessionAuth();
          const next = clientId
            ? `/client-nutrition-profile?client_id=${encodeURIComponent(clientId)}`
            : '/client-nutrition-profile';
          const loginPath = authRole === 'client' ? '/client-login' : '/doctor-auth';
          dispatch({
            type: 'LOAD_ERROR',
            payload: 'Session expired or unauthorized. Please login again to continue.',
          });
          if (typeof window !== 'undefined') {
            window.location.assign(`${loginPath}?next=${encodeURIComponent(next)}`);
          }
          return;
        }

        dispatch({
          type: 'LOAD_SUCCESS',
          payload: {
            fields: buildNutritionFields({
              ...localDraft.fields,
              dietScheduleType:
                localDraft.fields?.dietScheduleType ||
                cachedClientData.diet_schedule_type ||
                cachedClientData.dietScheduleType ||
                'summer',
            }),
            trainingSessions: localDraft.trainingSessions,
            supplements: localDraft.supplements,
          },
        });
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [authRole, canUseNutritionApi, clientId, isClientSession, requiresClientId]);

  useEffect(() => {
    if (!state.clientId || state.loading) return;
    setDraft({
      fields: state.fields,
      trainingSessions: state.trainingSessions,
      supplements: state.supplements,
    });
  }, [setDraft, state.clientId, state.fields, state.loading, state.supplements, state.trainingSessions]);

  const saveProfile = async () => {
    if (requiresClientId && !clientId) {
      dispatch({ type: 'SAVE_ERROR', payload: 'Missing client id.' });
      return { ok: false };
    }

    if (!canUseNutritionApi) {
      const next = clientId
        ? `/client-nutrition-profile?client_id=${encodeURIComponent(clientId)}`
        : '/client-nutrition-profile';
      const loginPath = authRole === 'client' ? '/client-login' : '/doctor-auth';
      dispatch({
        type: 'SAVE_ERROR',
        payload: 'Unauthorized. Please login again, then save Nutrition Profile.',
      });
      if (typeof window !== 'undefined') {
        window.location.assign(`${loginPath}?next=${encodeURIComponent(next)}`);
      }
      return { ok: false };
    }

    dispatch({ type: 'SAVE_START' });
    const payload = isClientSession
      ? buildClientProfileNutritionPayload(state)
      : buildNutritionPayload(state);
    const endpoint = isClientSession
      ? '/api/client/profile'
      : `/api/admin/clients/${encodeURIComponent(clientId)}/nutrition`;

    try {
      await apiClient.put(endpoint, payload);

      try {
        const resolvedId = String(clientId || state.clientId || localStorage.getItem('currentClientId') || '').trim();
        const displayId = String(safeJsonGet(local, 'lastClientContextV1', {})?.display_id || '').trim();
        const cacheIds = Array.from(new Set([resolvedId, displayId].filter(Boolean)));
        const existing = safeJsonGet(local, `clientData_${resolvedId || 'self'}`, {});
        const merged = {
          ...existing,
          height: payload.height,
          weight: payload.weight,
          bmi: payload.bmi,
          bodyFat: payload.body_fat_percentage,
          muscleMass: payload.skeletal_muscle,
          bodyFatMass: payload.body_fat_mass,
          musclePercent: payload.muscle_percentage,
          bmr: payload.bmr,
          activityLevel: payload.activity_level || existing.activityLevel || 'N/A',
          sport: payload.sport || existing.sport || 'N/A',
          position: payload.position || existing.position || 'N/A',
          tdee: payload.tdee,
          progressionType: payload.progression_type || existing.progressionType || 'N/A',
          calories: payload.calories,
          proteinTarget: payload.protein_target,
          carbsTarget: payload.carbs_target,
          fatsTarget: payload.fats_target,
          waterInBody: payload.water_in_body,
          waterIntake: payload.water_intake,
          minerals: payload.minerals,
          diet_schedule_type: payload.diet_schedule_type,
          dietScheduleType: payload.diet_schedule_type,
          competition_status: payload.competition_status,
          competitionStatus: payload.competition_status,
          competition_date: payload.competition_date,
          competitionDate: payload.competition_date,
          days_left: payload.days_left,
          daysLeft: payload.days_left,
          goal_weight: payload.goal_weight,
          goalWeight: payload.goal_weight,
          trainingDetails: payload.training_sessions,
        };
        cacheIds.forEach((id) => {
          safeJsonSet(local, `clientData_${id}`, { ...(safeJsonGet(local, `clientData_${id}`, {}) || {}), ...merged });
          safeJsonSet(local, `clientDashboardCache_${id}`, { ...(safeJsonGet(local, `clientDashboardCache_${id}`, {}) || {}), ...merged });
          safeJsonSet(local, `clientFullProfile_${id}`, { ...(safeJsonGet(local, `clientFullProfile_${id}`, {}) || {}), ...merged });
          safeJsonSet(local, `clientDetail_${id}`, {
            ...(safeJsonGet(local, `clientDetail_${id}`, {}) || {}),
            competition_status: payload.competition_status,
            competitionStatus: payload.competition_status,
            competition_date: payload.competition_date,
            competitionDate: payload.competition_date,
            days_left: payload.days_left,
            daysLeft: payload.days_left,
            goal_weight: payload.goal_weight,
            goalWeight: payload.goal_weight,
          });
        });

        const clients = safeJsonGet(local, 'clients', []);
        if (Array.isArray(clients) && cacheIds.length) {
          const updated = clients.map((row) => {
            const rowId = String(row?.id || '');
            const rowDisplayId = String(row?.display_id || '');
            if (!cacheIds.includes(rowId) && !cacheIds.includes(rowDisplayId)) return row;
            return {
              ...row,
              height: payload.height,
              weight: payload.weight,
              bmi: payload.bmi,
              body_fat_percentage: payload.body_fat_percentage,
              skeletal_muscle: payload.skeletal_muscle,
              tdee: payload.tdee,
              goal_weight: payload.goal_weight,
              competition_status: payload.competition_status,
              protein_target: payload.protein_target,
              carbs_target: payload.carbs_target,
              fats_target: payload.fats_target,
              competition_date: payload.competition_date,
              activity_level: payload.activity_level,
              diet_schedule_type: payload.diet_schedule_type,
              sport: payload.sport || row.sport,
              position: payload.position || row.position,
            };
          });
          safeJsonSet(local, 'clients', updated);
        }
      } catch {
        // Cache updates are best effort only.
      }

      clearDraft();
      dispatch({ type: 'SAVE_SUCCESS', payload: 'Nutrition profile saved successfully.' });

      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      await wait(550);
      if (flow === 'add-client') {
        navigate('/clients');
      } else if (flow === 'profile-setup' || flow === 'signup') {
        navigate('/client-dashboard');
      }

      return { ok: true };
    } catch (error) {
      if (error?.response?.status === 401) {
        clearSessionAuth();
        const next = clientId
          ? `/client-nutrition-profile?client_id=${encodeURIComponent(clientId)}`
          : '/client-nutrition-profile';
        const loginPath = authRole === 'client' ? '/client-login' : '/doctor-auth';
        dispatch({
          type: 'SAVE_ERROR',
          payload: 'Session expired or unauthorized. Please login again to continue.',
        });
        if (typeof window !== 'undefined') {
          window.location.assign(`${loginPath}?next=${encodeURIComponent(next)}`);
        }
        return { ok: false };
      }
      dispatch({ type: 'SAVE_ERROR', payload: extractApiError(error, 'Failed to save nutrition profile.') });
      return { ok: false };
    }
  };

  const caloriesLabel = useMemo(
    () => getCaloriesLabel(state.fields.progressionType),
    [state.fields.progressionType]
  );

  return {
    state,
    canEditDietScheduleType: authRole === 'admin',
    constants: {
      days: DAYS,
      activityOptions: [
        { value: 'extremely_active', label: 'Extremely Active' },
        { value: 'very_active', label: 'Very Active' },
        { value: 'moderately_active', label: 'Moderately Active' },
        { value: 'lightly_active', label: 'Lightly Active' },
        { value: 'sedentary', label: 'Sedentary' },
      ],
      progressionOptions: [
        { value: '', label: 'Select' },
        { value: 'cut', label: 'Cut' },
        { value: 'maintain', label: 'Maintain' },
        { value: 'bulk', label: 'Bulk' },
      ],
      competitionOptions: [
        { value: 'none', label: 'None' },
        { value: 'set', label: 'Set date' },
      ],
    },
    caloriesLabel,
    hasDraft,
    restoreDraft: () => {
      const normalized = normalizeDraftSnapshot(draft);
      dispatch({ type: 'RESTORE_DRAFT', payload: normalized });
    },
    discardDraft: () => {
      clearDraft();
      dispatch({ type: 'SAVE_SUCCESS', payload: 'Saved draft discarded.' });
    },
    updateField: (field, value) => dispatch({ type: 'SET_FIELD', payload: { field, value } }),
    autofill: () => dispatch({ type: 'AUTOFILL' }),
    addTraining: () => dispatch({ type: 'ADD_TRAINING' }),
    removeTraining: (index) => dispatch({ type: 'REMOVE_TRAINING', payload: index }),
    updateTraining: (index, field, value) => dispatch({ type: 'UPDATE_TRAINING', payload: { index, field, value } }),
    toggleTrainingDay: (index, day) => dispatch({ type: 'TOGGLE_TRAINING_DAY', payload: { index, day } }),
    addSupplement: () => dispatch({ type: 'ADD_SUPPLEMENT' }),
    removeSupplement: (index) => dispatch({ type: 'REMOVE_SUPPLEMENT', payload: index }),
    updateSupplement: (index, field, value) => dispatch({ type: 'UPDATE_SUPPLEMENT', payload: { index, field, value } }),
    saveProfile,
  };
}
