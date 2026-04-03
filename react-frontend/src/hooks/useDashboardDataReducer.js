const DAY_KEYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toMacroNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseDateValue(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function computeDaysUntilCompetition(competitionDateRaw) {
  const competitionDate = parseDateValue(competitionDateRaw);
  if (!competitionDate) return null;

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(competitionDate.getFullYear(), competitionDate.getMonth(), competitionDate.getDate());
  const diffMs = end.getTime() - start.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function normalizeMealStatus(rawStatus) {
  const value = String(rawStatus || 'not-completed').toLowerCase().trim();
  return value === 'completed' ? 'completed' : 'not-completed';
}

function getTodayDayName() {
  return DAY_KEYS[new Date().getDay()] || 'Sunday';
}

function buildMealId(dayName, meal, index) {
  const mealKey = String(meal?.type || `meal-${index + 1}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${String(dayName || '').toLowerCase()}-${mealKey || `meal-${index + 1}`}-${index}`;
}

export function buildTodayMeals(profile) {
  const dayName = getTodayDayName();
  const dayMeals = Array.isArray(profile?.meal_swaps?.dayMeals?.[dayName])
    ? profile.meal_swaps.dayMeals[dayName]
    : [];

  return dayMeals.map((meal, index) => ({
    dayName,
    mealIndex: index,
    mealId: buildMealId(dayName, meal, index),
    mealKey: String(meal?.type || '').toLowerCase(),
    mealLabel: meal?.type || `Meal ${index + 1}`,
    scheduledTime: meal?.time || 'N/A',
    en: meal?.en || meal?.description_en || meal?.description || meal?.name || meal?.meal || '',
    ar: meal?.ar || meal?.description_ar || '',
    protein: toNumber(meal?.protein),
    carbs: toNumber(meal?.carbs),
    fats: toNumber(meal?.fats),
    calories: toNumber(meal?.calories),
  }));
}

export function buildSummary(profile) {
  const weight = toNumber(profile?.weight);
  const goalWeight = toNumber(profile?.goal_weight);
  const protein = toNumber(profile?.protein_target) || 0;
  const carbs = toNumber(profile?.carbs_target) || 0;
  const fats = toNumber(profile?.fats_target) || 0;
  const tdee = toNumber(profile?.tdee);
  const targetCalories = tdee || (protein * 4 + carbs * 4 + fats * 9);
  const competitionDate = profile?.competition_date || null;
  const daysUntilCompetition = computeDaysUntilCompetition(competitionDate);

  return {
    weight,
    goalWeight,
    targetCalories,
    protein,
    carbs,
    fats,
    competitionDate,
    daysUntilCompetition,
  };
}

export function buildMacroState(profile, todayMeals, mealStatuses) {
  const proteinTarget = toNumber(profile?.protein_target) || 0;
  const carbsTarget = toNumber(profile?.carbs_target) || 0;
  const fatsTarget = toNumber(profile?.fats_target) || 0;
  const caloriesTarget = toNumber(profile?.tdee) || (proteinTarget * 4 + carbsTarget * 4 + fatsTarget * 9);

  const totalMeals = todayMeals.length;
  const fallbackProtein = totalMeals ? proteinTarget / totalMeals : 0;
  const fallbackCarbs = totalMeals ? carbsTarget / totalMeals : 0;
  const fallbackFats = totalMeals ? fatsTarget / totalMeals : 0;
  const fallbackCalories = totalMeals ? caloriesTarget / totalMeals : 0;

  let consumedProtein = 0;
  let consumedCarbs = 0;
  let consumedFats = 0;
  let consumedCalories = 0;
  let completeMeals = 0;

  todayMeals.forEach((meal) => {
    const status = normalizeMealStatus(mealStatuses[meal.mealId]);
    if (status !== 'completed') return;

    completeMeals += 1;
    consumedProtein += toMacroNumber(meal.protein, fallbackProtein);
    consumedCarbs += toMacroNumber(meal.carbs, fallbackCarbs);
    consumedFats += toMacroNumber(meal.fats, fallbackFats);
    consumedCalories += toMacroNumber(meal.calories, fallbackCalories);
  });

  return {
    target: {
      calories: Math.round(caloriesTarget),
      protein: Math.round(proteinTarget),
      carbs: Math.round(carbsTarget),
      fats: Math.round(fatsTarget),
    },
    consumed: {
      calories: Math.round(consumedCalories),
      protein: Math.round(consumedProtein),
      carbs: Math.round(consumedCarbs),
      fats: Math.round(consumedFats),
    },
    totalMeals,
    completeMeals,
    pendingMeals: Math.max(totalMeals - completeMeals, 0),
  };
}

function getMealStatusesStorageKey(profile) {
  const id = profile?.display_id || profile?.id;
  return id ? `mealStatuses_${id}` : 'mealStatuses';
}

export function readStoredStatuses(profile) {
  const key = getMealStatusesStorageKey(profile);
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '{}');
    return Object.fromEntries(Object.entries(raw || {}).map(([mealId, status]) => [mealId, normalizeMealStatus(status)]));
  } catch {
    return {};
  }
}

export function writeStoredStatuses(profile, statuses) {
  const key = getMealStatusesStorageKey(profile);
  localStorage.setItem(key, JSON.stringify(statuses));
  localStorage.setItem('mealStatuses', JSON.stringify(statuses));
}

export function buildTodayMacrosPayload(todayMeals, mealStatuses, macro) {
  const totalMeals = todayMeals.length;
  const fallbackProtein = totalMeals ? macro.target.protein / totalMeals : 0;
  const fallbackCarbs = totalMeals ? macro.target.carbs / totalMeals : 0;
  const fallbackFats = totalMeals ? macro.target.fats / totalMeals : 0;
  const fallbackCalories = totalMeals ? macro.target.calories / totalMeals : 0;

  return {
    date: new Date().toISOString().slice(0, 10),
    target_calories: macro.target.calories,
    target_protein: macro.target.protein,
    target_carbs: macro.target.carbs,
    target_fats: macro.target.fats,
    consumed_calories: macro.consumed.calories,
    consumed_protein: macro.consumed.protein,
    consumed_carbs: macro.consumed.carbs,
    consumed_fats: macro.consumed.fats,
    meals: todayMeals.map((meal) => ({
      meal_id: meal.mealId,
      meal_key: meal.mealKey,
      meal_label: meal.mealLabel,
      scheduled_time: meal.scheduledTime,
      status: normalizeMealStatus(mealStatuses[meal.mealId]),
      calories: toMacroNumber(meal.calories, fallbackCalories),
      protein: toMacroNumber(meal.protein, fallbackProtein),
      carbs: toMacroNumber(meal.carbs, fallbackCarbs),
      fats: toMacroNumber(meal.fats, fallbackFats),
    })),
  };
}

export function buildDashboardInitialState() {
  return {
    loading: true,
    syncing: false,
    error: '',
    profile: null,
    todayMeals: [],
    mealStatuses: {},
    macro: {
      target: { calories: 0, protein: 0, carbs: 0, fats: 0 },
      consumed: { calories: 0, protein: 0, carbs: 0, fats: 0 },
      totalMeals: 0,
      completeMeals: 0,
      pendingMeals: 0,
    },
  };
}

export function dashboardDataReducer(state, action) {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: '' };
    case 'LOAD_SUCCESS':
      return {
        ...state,
        loading: false,
        error: '',
        profile: action.payload.profile,
        todayMeals: action.payload.todayMeals,
        mealStatuses: action.payload.mealStatuses,
        macro: action.payload.macro,
      };
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.payload || 'Failed to load dashboard data.' };
    case 'SET_SYNCING':
      return { ...state, syncing: Boolean(action.payload) };
    case 'UPDATE_STATUSES':
      return {
        ...state,
        mealStatuses: action.payload.mealStatuses,
        macro: action.payload.macro,
      };
    case 'SET_BACKEND_MACRO':
      return {
        ...state,
        macro: {
          ...state.macro,
          consumed: {
            calories: Math.round(action.payload.consumed_calories ?? state.macro.consumed.calories ?? 0),
            protein: Math.round(action.payload.consumed_protein ?? state.macro.consumed.protein ?? 0),
            carbs: Math.round(action.payload.consumed_carbs ?? state.macro.consumed.carbs ?? 0),
            fats: Math.round(action.payload.consumed_fats ?? state.macro.consumed.fats ?? 0),
          },
          pendingMeals: action.payload.pending_meals ?? state.macro.pendingMeals,
          completeMeals: action.payload.complete_meals ?? state.macro.completeMeals,
          totalMeals: action.payload.total_meals ?? state.macro.totalMeals,
        },
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        profile: action.payload.profile,
        todayMeals: action.payload.todayMeals ?? state.todayMeals,
        macro: action.payload.macro ?? state.macro,
      };
    default:
      return state;
  }
}
