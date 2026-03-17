import { useMemo, useReducer } from 'react';

const STORAGE_KEY = 'dietPlans';
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MEALS = ['breakfast', 'snack1', 'lunch', 'dinner', 'preworkout', 'postworkout'];

function safeReadPlans() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWritePlans(plans) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch {
    // Ignore storage errors in restricted runtimes.
  }
}

function buildMealsBlock() {
  const day = {};
  MEALS.forEach((meal) => {
    day[meal] = { time: '', en: '', ar: '' };
  });
  return day;
}

export function buildDietPlanDraft() {
  const draft = {
    minCalories: '',
    maxCalories: '',
    dietType: '',
  };
  DAYS.forEach((day) => {
    draft[day] = buildMealsBlock();
  });
  return draft;
}

export function buildDietPlanPayload(draft) {
  const payload = {
    minCalories: Number(draft.minCalories || 0),
    maxCalories: Number(draft.maxCalories || 0),
    dietType: String(draft.dietType || '').trim(),
  };

  DAYS.forEach((day) => {
    payload[day] = {};
    MEALS.forEach((meal) => {
      const source = draft?.[day]?.[meal] || {};
      payload[day][meal] = {
        time: String(source.time || ''),
        en: String(source.en || ''),
        ar: String(source.ar || ''),
      };
    });
  });

  return payload;
}

export function buildDietPlanSummary(plan) {
  const min = Number(plan?.minCalories || 0);
  const max = Number(plan?.maxCalories || 0);
  const type = String(plan?.dietType || 'No type specified');
  return {
    caloriesLabel: `${min}-${max} kcal`,
    type,
    totalMeals: DAYS.length * MEALS.length,
  };
}

export function buildDietManagementInitialState() {
  return {
    plans: safeReadPlans(),
    modalOpen: false,
    editingIndex: -1,
    activeDay: 'sunday',
    draft: buildDietPlanDraft(),
    error: '',
    message: '',
  };
}

export function dietManagementReducer(state, action) {
  switch (action.type) {
    case 'OPEN_CREATE':
      return {
        ...state,
        modalOpen: true,
        editingIndex: -1,
        activeDay: 'sunday',
        draft: buildDietPlanDraft(),
        error: '',
        message: '',
      };
    case 'OPEN_EDIT':
      return {
        ...state,
        modalOpen: true,
        editingIndex: action.payload.index,
        activeDay: 'sunday',
        draft: buildDietPlanPayload(action.payload.plan),
        error: '',
      };
    case 'CLOSE_MODAL':
      return {
        ...state,
        modalOpen: false,
        editingIndex: -1,
        draft: buildDietPlanDraft(),
      };
    case 'SET_ACTIVE_DAY':
      return { ...state, activeDay: action.payload };
    case 'UPDATE_FIELD':
      return {
        ...state,
        draft: {
          ...state.draft,
          [action.payload.field]: action.payload.value,
        },
      };
    case 'UPDATE_MEAL': {
      const { day, meal, field, value } = action.payload;
      return {
        ...state,
        draft: {
          ...state.draft,
          [day]: {
            ...state.draft[day],
            [meal]: {
              ...state.draft[day][meal],
              [field]: value,
            },
          },
        },
      };
    }
    case 'SAVE_PLAN_SUCCESS':
      return {
        ...state,
        plans: action.payload,
        modalOpen: false,
        editingIndex: -1,
        draft: buildDietPlanDraft(),
        message: 'Plan saved successfully.',
        error: '',
      };
    case 'DELETE_PLAN_SUCCESS':
      return {
        ...state,
        plans: action.payload,
        message: 'Plan deleted successfully.',
        error: '',
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, message: '' };
    case 'SET_MESSAGE':
      return { ...state, message: action.payload, error: '' };
    default:
      return state;
  }
}

export function useDietManagement() {
  const [state, dispatch] = useReducer(dietManagementReducer, undefined, buildDietManagementInitialState);

  const openCreate = () => dispatch({ type: 'OPEN_CREATE' });
  const openEdit = (index) => {
    const plan = state.plans[index];
    if (!plan) return;
    dispatch({ type: 'OPEN_EDIT', payload: { index, plan } });
  };
  const closeModal = () => dispatch({ type: 'CLOSE_MODAL' });
  const setActiveDay = (day) => dispatch({ type: 'SET_ACTIVE_DAY', payload: day });
  const updateField = (field, value) => dispatch({ type: 'UPDATE_FIELD', payload: { field, value } });
  const updateMeal = (day, meal, field, value) => dispatch({ type: 'UPDATE_MEAL', payload: { day, meal, field, value } });

  const savePlan = () => {
    const minCalories = Number(state.draft.minCalories || 0);
    const maxCalories = Number(state.draft.maxCalories || 0);

    if (!minCalories || !maxCalories) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter both min and max calories.' });
      return false;
    }

    const nextPlan = buildDietPlanPayload(state.draft);
    const nextPlans = [...state.plans];
    if (state.editingIndex >= 0) {
      nextPlans[state.editingIndex] = nextPlan;
    } else {
      nextPlans.push(nextPlan);
    }

    safeWritePlans(nextPlans);
    dispatch({ type: 'SAVE_PLAN_SUCCESS', payload: nextPlans });
    return true;
  };

  const deletePlan = (index) => {
    const nextPlans = state.plans.filter((_, idx) => idx !== index);
    safeWritePlans(nextPlans);
    dispatch({ type: 'DELETE_PLAN_SUCCESS', payload: nextPlans });
  };

  const plansWithSummary = useMemo(() => {
    return state.plans.map((plan, index) => ({
      index,
      plan,
      summary: buildDietPlanSummary(plan),
    }));
  }, [state.plans]);

  return {
    state,
    constants: { days: DAYS, meals: MEALS },
    plansWithSummary,
    openCreate,
    openEdit,
    closeModal,
    setActiveDay,
    updateField,
    updateMeal,
    savePlan,
    deletePlan,
  };
}
