const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
    en: normalizeText(partial.en) || '',
    ar: normalizeText(partial.ar) || '',
  };
}

function normalizeDayMeals(rawDayMeals) {
  const next = buildEmptyDayMeals();
  if (!rawDayMeals || typeof rawDayMeals !== 'object') return next;

  WEEK_DAYS.forEach((day) => {
    const meals = Array.isArray(rawDayMeals[day]) ? rawDayMeals[day] : [];
    next[day] = meals.map((meal) => createMealRow(meal));
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
  const mentalText = normalizeText(programsState.programFields.mentalText);
  const supplementsText = normalizeText(programsState.programFields.supplementsText);
  const competitionStatus = normalizeText(programsState.programFields.competitionStatus);

  return {
    notesText,
    mentalText,
    supplementsText,
    competitionStatus,
    mealSwapsPayload: {
      selectedPlanIndex: programsState.selectedPlanIndex,
      dayMeals: programsState.dayMeals,
      programFields: {
        ...programsState.programFields,
        notesText,
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
    default:
      return state;
  }
}

export { WEEK_DAYS };
