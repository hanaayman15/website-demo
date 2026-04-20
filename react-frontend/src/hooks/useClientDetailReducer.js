const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PLAN_TO_WEEK_DAY = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};
const PLAN_MEAL_TYPES = {
  breakfast: 'Breakfast',
  snack1: 'Snack 1',
  lunch: 'Lunch',
  dinner: 'Dinner',
  preworkout: 'Pre-Workout Snack',
  postworkout: 'Post-Workout Snack',
};

function formatPlanTime(rawTime) {
  const value = String(rawTime || '').trim();
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return value || '12:00 PM';
  const hour24 = Number(match[1]);
  const minute = match[2];
  if (!Number.isFinite(hour24)) return value;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = ((hour24 + 11) % 12) + 1;
  return `${hour12}:${minute} ${ampm}`;
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
  const key = normalizeMealKey(meal?.type);
  return key.includes('breakfast');
}

function isPreWorkoutMeal(meal) {
  const key = normalizeMealKey(meal?.type);
  return key.includes('preworkout');
}

function isPostWorkoutMeal(meal) {
  const key = normalizeMealKey(meal?.type);
  return key.includes('postworkout');
}

function isDinnerMeal(meal) {
  const key = normalizeMealKey(meal?.type);
  return key.includes('dinner');
}

function isSnack2Meal(meal) {
  const key = normalizeMealKey(meal?.type);
  return key === 'snack2' || key.includes('snack2');
}

function withDynamicSchedule(meals, scheduleContext = {}) {
  if (!Array.isArray(meals) || !meals.length) return meals;

  const wakeMinutes = parseTimeToMinutes(scheduleContext?.wakeUpTime);
  const breakfastBase = Number.isFinite(wakeMinutes) ? wakeMinutes + 30 : null;

  const trainingStartMinutes = parseTimeToMinutes(scheduleContext?.trainingTime);
  const trainingEndMinutes = parseTimeToMinutes(scheduleContext?.trainingEndTime);
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
      .map((meal) => parseTimeToMinutes(meal?.time))
      .filter((value) => Number.isFinite(value));
    firstBaseSlot = existingTimes.length ? Math.min(...existingTimes) : 8 * 60;
  }

  let beforeTrainingIndexes = generalIndexes;
  let afterTrainingIndexes = [];

  if (hasTraining) {
    if (isMorningTraining) {
      // Morning training: pre and post first, then remaining meals after post workout.
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
      return { ...meal, time: formatMinutesToTime(explicit), sortMinutes: explicit };
    }
    const parsedExisting = parseTimeToMinutes(meal?.time);
    return {
      ...meal,
      time: Number.isFinite(parsedExisting) ? formatMinutesToTime(parsedExisting) : 'N/A',
      sortMinutes: Number.isFinite(parsedExisting) ? parsedExisting : Number.MAX_SAFE_INTEGER,
    };
  });

  return withTimes
    .sort((a, b) => {
      const aTime = Number.isFinite(a.sortMinutes) ? a.sortMinutes : Number.MAX_SAFE_INTEGER;
      const bTime = Number.isFinite(b.sortMinutes) ? b.sortMinutes : Number.MAX_SAFE_INTEGER;
      if (aTime !== bTime) return aTime - bTime;
      return (a.type || '').localeCompare(b.type || '');
    })
    .map(({ sortMinutes, ...meal }) => meal);
}

function normalizeNotes(value) {
  const text = String(value || '').trim();
  if (!text || text === 'No notes added' || text === 'N/A') return '';
  return text;
}

function normalizeText(value) {
  const text = String(value || '').trim();
  if (!text || text === 'N/A') return '';
  return text;
}

function buildEmptyDayMeals() {
  return WEEK_DAYS.reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {});
}

function createMealRow(partial = {}) {
  return {
    id: partial.id || `meal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: normalizeText(partial.type) || 'New Meal',
    time: normalizeText(partial.time) || '12:00 PM',
    notes: normalizeText(partial.notes || partial.note) || '',
    en: normalizeText(partial.en) || '',
    ar: normalizeText(partial.ar) || '',
  };
}

function normalizeDayMeals(rawDayMeals) {
  const next = buildEmptyDayMeals();
  if (!rawDayMeals || typeof rawDayMeals !== 'object') return next;

  WEEK_DAYS.forEach((day) => {
    const meals = Array.isArray(rawDayMeals[day]) ? rawDayMeals[day] : [];
    next[day] = meals
      .filter((meal) => !isSnack2Meal(meal))
      .map((meal) => {
        const mealRow = createMealRow(meal);
        if (!('notes' in mealRow)) mealRow.notes = '';
        return mealRow;
      });
  });

  return next;
}

function mapDietPlanToDayMeals(plan, scheduleContext = {}) {
  const next = buildEmptyDayMeals();
  if (!plan || typeof plan !== 'object') return next;

  Object.entries(PLAN_TO_WEEK_DAY).forEach(([planDay, weekDay]) => {
    const sourceDay = plan?.[planDay];
    if (!sourceDay || typeof sourceDay !== 'object') return;

    const meals = Object.entries(PLAN_MEAL_TYPES).map(([planMeal, mealType]) => {
      const sourceMeal = sourceDay?.[planMeal] || {};
      return createMealRow({
        type: mealType,
        time: formatPlanTime(sourceMeal.time),
        notes: sourceMeal.notes || '',
        en: normalizeText(sourceMeal.en),
        ar: normalizeText(sourceMeal.ar),
      });
    });

    next[weekDay] = withDynamicSchedule(meals, scheduleContext);
  });

  return next;
}

function recomputeAllDayMeals(dayMeals, scheduleContext = {}) {
  const normalized = normalizeDayMeals(dayMeals);
  const next = buildEmptyDayMeals();

  WEEK_DAYS.forEach((day) => {
    const meals = Array.isArray(normalized[day]) ? normalized[day] : [];
    next[day] = withDynamicSchedule(meals, scheduleContext);
  });

  return next;
}

function reorder(items, fromIndex, toIndex) {
  if (fromIndex === toIndex) return items;
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function buildInitialProgramsState() {
  return {
    selectedPlanIndex: null,
    dayMeals: buildEmptyDayMeals(),
    programFields: {
      notesText: '',
      personalNotesText: '',
      mentalText: '',
      supplementsText: '',
      competitionEnabled: false,
      competitionStatus: '',
    },
  };
}

export function normalizeProgramsSource(source = {}, client = {}) {
  return {
    ...(source || {}),
    programFields: {
      notesText:
        source?.programFields?.notesText ||
        normalizeNotes(client.notes || client.additional_notes || client.additionalNotes),
      personalNotesText:
        source?.programFields?.personalNotesText ||
        normalizeNotes(client.personal_notes || client.personalNotes || client.additional_notes || client.additionalNotes),
      mentalText:
        source?.programFields?.mentalText ||
        normalizeText(client.mental_observation || client.mentalObservation),
      supplementsText:
        source?.programFields?.supplementsText || normalizeText(client.supplements),
      competitionEnabled:
        source?.programFields?.competitionEnabled ??
        client.competition_enabled ??
        client.competitionEnabled,
      competitionStatus:
        source?.programFields?.competitionStatus ||
        normalizeText(client.competition_status || client.competitionStatus),
    },
  };
}

export function buildProgramsPayload(programsState) {
  const notesText = normalizeNotes(programsState.programFields.notesText);
  const personalNotesText = normalizeNotes(programsState.programFields.personalNotesText);
  const mentalText = normalizeText(programsState.programFields.mentalText);
  const supplementsText = normalizeText(programsState.programFields.supplementsText);
  const competitionStatus = normalizeText(programsState.programFields.competitionStatus);
  const updatedAt = Date.now();

  return {
    notesText,
    personalNotesText,
    mentalText,
    supplementsText,
    competitionStatus,
    mealSwapsPayload: {
      __updatedAt: updatedAt,
      selectedPlanIndex: programsState.selectedPlanIndex,
      dayMeals: normalizeDayMeals(programsState.dayMeals),
      programFields: {
        ...programsState.programFields,
        notesText,
        personalNotesText,
        mentalText,
        supplementsText,
        competitionStatus,
      },
    },
  };
}

export function programsReducer(state, action) {
  switch (action.type) {
    case 'INIT_FROM_SOURCE': {
      const payload = action.payload || {};
      return {
        selectedPlanIndex: Number.isInteger(payload.selectedPlanIndex) ? payload.selectedPlanIndex : null,
        dayMeals: normalizeDayMeals(payload.dayMeals),
        programFields: {
          notesText: normalizeNotes(payload.programFields?.notesText),
          personalNotesText: normalizeNotes(payload.programFields?.personalNotesText),
          mentalText: normalizeText(payload.programFields?.mentalText),
          supplementsText: normalizeText(payload.programFields?.supplementsText),
          competitionEnabled: Boolean(payload.programFields?.competitionEnabled),
          competitionStatus: normalizeText(payload.programFields?.competitionStatus),
        },
      };
    }
    case 'UPDATE_FIELD': {
      const { field, value } = action.payload;
      return {
        ...state,
        programFields: {
          ...state.programFields,
          [field]: field === 'competitionEnabled' ? Boolean(value) : value,
        },
      };
    }
    case 'UPDATE_NOTES': {
      return {
        ...state,
        programFields: {
          ...state.programFields,
          notesText: action.payload ?? '',
        },
      };
    }
    case 'ADD_MEAL': {
      const { dayName } = action.payload;
      const currentMeals = Array.isArray(state.dayMeals[dayName]) ? state.dayMeals[dayName] : [];
      return {
        ...state,
        dayMeals: {
          ...state.dayMeals,
          [dayName]: [...currentMeals, createMealRow()],
        },
      };
    }
    case 'UPDATE_MEAL': {
      const { dayName, mealId, field, value } = action.payload;
      const currentMeals = Array.isArray(state.dayMeals[dayName]) ? state.dayMeals[dayName] : [];
      return {
        ...state,
        dayMeals: {
          ...state.dayMeals,
          [dayName]: currentMeals.map((meal) => (meal.id === mealId ? { ...meal, [field]: value } : meal)),
        },
      };
    }
    case 'REMOVE_MEAL': {
      const { dayName, mealId } = action.payload;
      const currentMeals = Array.isArray(state.dayMeals[dayName]) ? state.dayMeals[dayName] : [];
      return {
        ...state,
        dayMeals: {
          ...state.dayMeals,
          [dayName]: currentMeals.filter((meal) => meal.id !== mealId),
        },
      };
    }
    case 'MOVE_MEAL_UP': {
      const { dayName, mealId } = action.payload;
      const currentMeals = Array.isArray(state.dayMeals[dayName]) ? state.dayMeals[dayName] : [];
      const currentIndex = currentMeals.findIndex((meal) => meal.id === mealId);
      return {
        ...state,
        dayMeals: {
          ...state.dayMeals,
          [dayName]: reorder(currentMeals, currentIndex, currentIndex - 1),
        },
      };
    }
    case 'MOVE_MEAL_DOWN': {
      const { dayName, mealId } = action.payload;
      const currentMeals = Array.isArray(state.dayMeals[dayName]) ? state.dayMeals[dayName] : [];
      const currentIndex = currentMeals.findIndex((meal) => meal.id === mealId);
      return {
        ...state,
        dayMeals: {
          ...state.dayMeals,
          [dayName]: reorder(currentMeals, currentIndex, currentIndex + 1),
        },
      };
    }
    case 'APPLY_DIET_PLAN': {
      const { selectedPlanIndex, plan, scheduleContext } = action.payload;
      return {
        ...state,
        selectedPlanIndex,
        dayMeals: mapDietPlanToDayMeals(plan, scheduleContext),
      };
    }
    case 'RECOMPUTE_MEAL_TIMES': {
      const { scheduleContext } = action.payload || {};
      return {
        ...state,
        dayMeals: recomputeAllDayMeals(state.dayMeals, scheduleContext),
      };
    }
    default:
      return state;
  }
}

export { WEEK_DAYS };
