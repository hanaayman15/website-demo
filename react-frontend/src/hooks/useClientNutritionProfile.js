import { useEffect, useMemo, useReducer } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/api';

const DEFAULT_ACTIVITY = 'extremely_active';
const DEFAULT_COMPETITION = 'none';
const DEFAULT_PROGRESSION = '';
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

function mapApiNutritionToState(data = {}) {
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
      waterInBody: data.water_in_body,
      waterIntake: data.water_intake,
      minerals: data.minerals,
      testRecord: data.test_record_notes,
      injuries: data.injuries,
      mentalNotes: data.mental_notes,
      foodAllergies: data.food_allergies,
      medicalNotes: data.medical_notes,
      foodLikes: data.food_likes,
      foodDislikes: data.food_dislikes,
      competition: data.competition_status || DEFAULT_COMPETITION,
      competitionDate: data.competition_date,
      daysLeft: data.days_left,
      goalWeight: data.goal_weight,
      additionalNotes: data.additional_notes,
    }),
    trainingSessions: Array.isArray(data.training_sessions)
      ? data.training_sessions.map((item) => buildTrainingSession(item))
      : [],
    supplements: Array.isArray(data.supplements)
      ? data.supplements.map((item) => buildSupplement(item))
      : [],
  };
}

function safeStorageGetJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function safeStorageSetJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore draft persistence errors.
  }
}

function normalizeDraftSnapshot(rawDraft) {
  if (!rawDraft || typeof rawDraft !== 'object') {
    return buildNutritionFallbackDraft();
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
  const [searchParams] = useSearchParams();
  const [state, dispatch] = useReducer(
    clientNutritionProfileReducer,
    undefined,
    buildClientNutritionProfileInitialState
  );

  const clientId = searchParams.get('client_id') || '';

  useEffect(() => {
    dispatch({ type: 'SET_CLIENT', payload: clientId });
  }, [clientId]);

  useEffect(() => {
    if (!clientId) {
      dispatch({ type: 'LOAD_ERROR', payload: 'Missing client id.' });
      return;
    }

    let mounted = true;

    const load = async () => {
      dispatch({ type: 'LOAD_START' });
      const draftKey = buildNutritionDraftKey(clientId);
      const fallbackDraft = buildNutritionFallbackDraft();
      const localDraft = normalizeDraftSnapshot(safeStorageGetJson(draftKey, fallbackDraft));

      try {
        const response = await apiClient.get(`/api/admin/clients/${encodeURIComponent(clientId)}/nutrition`);
        if (!mounted) return;

        const mapped = mapApiNutritionToState(response?.data || {});
        const normalized = {
          fields: { ...mapped.fields, ...localDraft.fields },
          trainingSessions: mapped.trainingSessions.length ? mapped.trainingSessions : localDraft.trainingSessions,
          supplements: mapped.supplements.length ? mapped.supplements : localDraft.supplements,
        };
        dispatch({ type: 'LOAD_SUCCESS', payload: normalized });
      } catch {
        if (!mounted) return;
        dispatch({
          type: 'LOAD_SUCCESS',
          payload: {
            fields: buildNutritionFields(localDraft.fields),
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
  }, [clientId]);

  useEffect(() => {
    if (!state.clientId || state.loading) return;
    const draftKey = buildNutritionDraftKey(state.clientId);
    safeStorageSetJson(draftKey, {
      fields: state.fields,
      trainingSessions: state.trainingSessions,
      supplements: state.supplements,
    });
  }, [state.clientId, state.fields, state.loading, state.supplements, state.trainingSessions]);

  const saveProfile = async () => {
    if (!state.clientId) {
      dispatch({ type: 'SAVE_ERROR', payload: 'Missing client id.' });
      return { ok: false };
    }

    dispatch({ type: 'SAVE_START' });
    const payload = buildNutritionPayload(state);

    try {
      await apiClient.put(
        `/api/admin/clients/${encodeURIComponent(state.clientId)}/nutrition`,
        payload
      );

      try {
        const cacheKey = `clientData_${state.clientId}`;
        const existing = safeStorageGetJson(cacheKey, {});
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
          trainingDetails: payload.training_sessions,
        };
        safeStorageSetJson(cacheKey, merged);
      } catch {
        // Cache updates are best effort only.
      }

      dispatch({ type: 'SAVE_SUCCESS', payload: 'Nutrition profile saved successfully.' });
      return { ok: true };
    } catch (error) {
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
