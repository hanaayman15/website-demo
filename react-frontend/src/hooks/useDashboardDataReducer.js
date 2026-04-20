const DAY_KEYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toNumber(value) {
  if (typeof value === 'string') {
    const match = value.match(/-?\d+(?:\.\d+)?/);
    if (match) {
      const parsed = Number(match[0]);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toMacroNumber(value, fallback = 0) {
  const parsed = toNumber(value);
  if (Number.isFinite(parsed)) return parsed;
  const n = Number(fallback);
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

function parseTimeToMinutes(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return null;

  const twentyFour = value.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour) {
    const hours = Number(twentyFour[1]);
    const minutes = Number(twentyFour[2]);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return hours * 60 + minutes;
    }
  }

  const twelve = value.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (!twelve) return null;
  let hours = Number(twelve[1]);
  const minutes = Number(twelve[2]);
  const suffix = String(twelve[3] || '').toUpperCase();
  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
  if (suffix === 'AM' && hours === 12) hours = 0;
  if (suffix === 'PM' && hours < 12) hours += 12;
  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMinutes) {
  if (!Number.isFinite(totalMinutes)) return 'N/A';
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  let hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function normalizeMealKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isBreakfastMeal(meal) {
  const key = normalizeMealKey(meal?.mealKey || meal?.mealLabel);
  return key.includes('breakfast');
}

function isPreWorkoutMeal(meal) {
  const key = normalizeMealKey(meal?.mealKey || meal?.mealLabel);
  return key.includes('preworkout');
}

function isPostWorkoutMeal(meal) {
  const key = normalizeMealKey(meal?.mealKey || meal?.mealLabel);
  return key.includes('postworkout');
}

function isDinnerMeal(meal) {
  const key = normalizeMealKey(meal?.mealKey || meal?.mealLabel);
  return key.includes('dinner');
}

function withDynamicSchedule(profile, meals) {
  if (!Array.isArray(meals) || !meals.length) return meals;

  const wakeMinutes = parseTimeToMinutes(profile?.wake_up_time);
  const breakfastBase = Number.isFinite(wakeMinutes) ? wakeMinutes + 30 : null;

  const trainingStartMinutes = parseTimeToMinutes(profile?.training_time || profile?.training_start_time);
  const trainingEndMinutes = parseTimeToMinutes(profile?.training_end_time);
  const resolvedTrainingEnd = Number.isFinite(trainingEndMinutes)
    ? trainingEndMinutes
    : (Number.isFinite(trainingStartMinutes) ? trainingStartMinutes : null);
  const isMorningTraining = Number.isFinite(trainingStartMinutes) && trainingStartMinutes < 12 * 60;

  const breakfastIndex = meals.findIndex((meal) => isBreakfastMeal(meal));
  const preWorkoutIndex = meals.findIndex((meal) => isPreWorkoutMeal(meal));
  const postWorkoutIndex = meals.findIndex((meal) => isPostWorkoutMeal(meal));

  const assignedByIndex = new Map();

  if (Number.isFinite(trainingStartMinutes) && preWorkoutIndex >= 0) {
    assignedByIndex.set(preWorkoutIndex, trainingStartMinutes - 45);
  }
  if (Number.isFinite(resolvedTrainingEnd) && postWorkoutIndex >= 0) {
    assignedByIndex.set(postWorkoutIndex, resolvedTrainingEnd + 30);
  }

  const generalIndexes = meals
    .map((meal, index) => ({ meal, index }))
    .filter(({ index }) => index !== preWorkoutIndex && index !== postWorkoutIndex)
    .map(({ index }) => index);

  const hasTraining = Number.isFinite(trainingStartMinutes) || Number.isFinite(resolvedTrainingEnd);

  let firstBaseSlot = breakfastBase;
  if (!Number.isFinite(firstBaseSlot)) {
    const existingTimes = meals
      .map((meal) => parseTimeToMinutes(meal?.scheduledTime || meal?.time))
      .filter((value) => Number.isFinite(value));
    firstBaseSlot = existingTimes.length ? Math.min(...existingTimes) : 8 * 60;
  }

  let beforeTrainingIndexes = generalIndexes;
  let afterTrainingIndexes = [];

  if (hasTraining) {
    if (isMorningTraining) {
      // Morning training: pre and post should lead the day, then other meals follow.
      beforeTrainingIndexes = [];
      afterTrainingIndexes = [...generalIndexes];
    } else {
      beforeTrainingIndexes = generalIndexes.filter((index) => {
        if (isDinnerMeal(meals[index])) return false;
        if (postWorkoutIndex >= 0 && index > postWorkoutIndex) return false;
        if (preWorkoutIndex >= 0 && index > preWorkoutIndex) return false;
        return true;
      });

      afterTrainingIndexes = generalIndexes.filter((index) => !beforeTrainingIndexes.includes(index));
    }
  }

  let beforeSlot = firstBaseSlot;
  if (breakfastIndex >= 0 && beforeTrainingIndexes.includes(breakfastIndex)) {
    assignedByIndex.set(breakfastIndex, beforeSlot);
    beforeSlot += 180;
  }

  beforeTrainingIndexes.forEach((index) => {
    if (assignedByIndex.has(index)) return;
    assignedByIndex.set(index, beforeSlot);
    beforeSlot += 180;
  });

  if (afterTrainingIndexes.length) {
    const postBase = Number.isFinite(assignedByIndex.get(postWorkoutIndex))
      ? assignedByIndex.get(postWorkoutIndex) + 180
      : beforeSlot;

    let afterSlot = Number.isFinite(postBase) ? postBase : firstBaseSlot;
    afterTrainingIndexes.forEach((index) => {
      if (assignedByIndex.has(index)) return;
      assignedByIndex.set(index, afterSlot);
      afterSlot += 180;
    });
  }

  const withTimes = meals.map((meal, index) => {
    const explicit = assignedByIndex.get(index);
    if (Number.isFinite(explicit)) {
      return { ...meal, scheduledTime: formatMinutesToTime(explicit), sortMinutes: explicit };
    }
    const parsedExisting = parseTimeToMinutes(meal?.scheduledTime || meal?.time);
    return {
      ...meal,
      scheduledTime: Number.isFinite(parsedExisting) ? formatMinutesToTime(parsedExisting) : 'N/A',
      sortMinutes: Number.isFinite(parsedExisting) ? parsedExisting : Number.MAX_SAFE_INTEGER,
    };
  });

  return withTimes
    .sort((a, b) => {
      const aTime = Number.isFinite(a.sortMinutes) ? a.sortMinutes : Number.MAX_SAFE_INTEGER;
      const bTime = Number.isFinite(b.sortMinutes) ? b.sortMinutes : Number.MAX_SAFE_INTEGER;
      if (aTime !== bTime) return aTime - bTime;
      return (a.mealIndex || 0) - (b.mealIndex || 0);
    })
    .map(({ sortMinutes, ...meal }) => meal);
}

export function buildTodayMeals(profile) {
  const dayName = getTodayDayName();
  const dayMeals = Array.isArray(profile?.meal_swaps?.dayMeals?.[dayName])
    ? profile.meal_swaps.dayMeals[dayName]
    : [];

  const mapped = dayMeals.map((meal, index) => ({
    dayName,
    mealIndex: index,
    mealId: buildMealId(dayName, meal, index),
    mealKey: String(meal?.type || '').toLowerCase(),
    mealLabel: meal?.type || `Meal ${index + 1}`,
    scheduledTime: meal?.time || 'N/A',
    notes: meal?.notes || meal?.note || '',
    en: meal?.en || meal?.description_en || meal?.description || meal?.name || meal?.meal || '',
    ar: meal?.ar || meal?.description_ar || '',
    protein: toNumber(meal?.protein),
    carbs: toNumber(meal?.carbs),
    fats: toNumber(meal?.fats),
    calories: toNumber(meal?.calories),
  }));

  return withDynamicSchedule(profile, mapped);
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
  const profileProteinTarget = toNumber(profile?.protein_target) || 0;
  const profileCarbsTarget = toNumber(profile?.carbs_target) || 0;
  const profileFatsTarget = toNumber(profile?.fats_target) || 0;

  const mealsProteinTarget = todayMeals.reduce((sum, meal) => sum + toMacroNumber(meal?.protein, 0), 0);
  const mealsCarbsTarget = todayMeals.reduce((sum, meal) => sum + toMacroNumber(meal?.carbs, 0), 0);
  const mealsFatsTarget = todayMeals.reduce((sum, meal) => sum + toMacroNumber(meal?.fats, 0), 0);
  const mealsCaloriesTarget = todayMeals.reduce((sum, meal) => sum + toMacroNumber(meal?.calories, 0), 0);

  const hasMealMacroTargets = mealsProteinTarget > 0 || mealsCarbsTarget > 0 || mealsFatsTarget > 0 || mealsCaloriesTarget > 0;

  const proteinTarget = hasMealMacroTargets ? mealsProteinTarget : profileProteinTarget;
  const carbsTarget = hasMealMacroTargets ? mealsCarbsTarget : profileCarbsTarget;
  const fatsTarget = hasMealMacroTargets ? mealsFatsTarget : profileFatsTarget;
  const profileCaloriesTarget = toNumber(profile?.tdee) || (profileProteinTarget * 4 + profileCarbsTarget * 4 + profileFatsTarget * 9);
  const caloriesTarget = hasMealMacroTargets
    ? (mealsCaloriesTarget || (proteinTarget * 4 + carbsTarget * 4 + fatsTarget * 9))
    : profileCaloriesTarget;

  const totalMeals = todayMeals.length;
  const fallbackProtein = totalMeals ? proteinTarget / totalMeals : 0;
  const fallbackCarbs = totalMeals ? carbsTarget / totalMeals : 0;
  const fallbackFats = totalMeals ? fatsTarget / totalMeals : 0;
  const fallbackCalories = totalMeals ? caloriesTarget / totalMeals : 0;

  const hasPerMealMacros = todayMeals.some((meal) => {
    const p = toNumber(meal?.protein) || 0;
    const c = toNumber(meal?.carbs) || 0;
    const f = toNumber(meal?.fats) || 0;
    const k = toNumber(meal?.calories) || 0;
    return p > 0 || c > 0 || f > 0 || k > 0;
  });

  let consumedProtein = 0;
  let consumedCarbs = 0;
  let consumedFats = 0;
  let consumedCalories = 0;
  let completeMeals = 0;

  todayMeals.forEach((meal) => {
    const status = normalizeMealStatus(mealStatuses[meal.mealId]);
    if (status !== 'completed') return;

    completeMeals += 1;
    if (hasPerMealMacros) {
      consumedProtein += toMacroNumber(meal.protein, fallbackProtein);
      consumedCarbs += toMacroNumber(meal.carbs, fallbackCarbs);
      consumedFats += toMacroNumber(meal.fats, fallbackFats);
      consumedCalories += toMacroNumber(meal.calories, fallbackCalories);
      return;
    }

    consumedProtein += fallbackProtein;
    consumedCarbs += fallbackCarbs;
    consumedFats += fallbackFats;
    consumedCalories += fallbackCalories;
  });

  if (completeMeals > 0) {
    if (proteinTarget > 0 && consumedProtein <= 0) consumedProtein = 1;
    if (carbsTarget > 0 && consumedCarbs <= 0) consumedCarbs = 1;
    if (fatsTarget > 0 && consumedFats <= 0) consumedFats = 1;
    if (caloriesTarget > 0 && consumedCalories <= 0) consumedCalories = 1;
  }

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
