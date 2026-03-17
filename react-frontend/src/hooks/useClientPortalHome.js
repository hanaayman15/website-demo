import { useEffect, useMemo, useReducer } from 'react';
import { apiClient } from '../services/api';
import { resolveAuthToken } from '../utils/authSession';

export const HOME_RECIPES = {
  steak: {
    key: 'steak',
    name: 'Steak Power Bowl',
    type: 'Lunch',
    description: 'Grilled ribeye steak with sweet potato, roasted broccoli, and garlic butter sauce',
    servingGrams: 460,
    calories: 520,
    protein: 38,
    ingredients: ['Ribeye Steak', 'Sweet Potato', 'Broccoli', 'Garlic', 'Butter'],
    instructions: ['Grill ribeye steak', 'Roast sweet potato and broccoli', 'Arrange in bowl'],
  },
  salmon: {
    key: 'salmon',
    name: 'Grilled Salmon Plate',
    type: 'Dinner',
    description: 'Omega-3 rich salmon fillet with roasted vegetables and brown rice',
    servingGrams: 430,
    calories: 580,
    protein: 45,
    ingredients: ['Salmon Fillet', 'Brown Rice', 'Broccoli', 'Lemon', 'Olive Oil'],
    instructions: ['Grill salmon fillet', 'Cook brown rice', 'Plate with roasted vegetables'],
  },
  smoothie: {
    key: 'smoothie',
    name: 'Recovery Smoothie Bowl',
    type: 'Snack',
    description: 'Protein-packed smoothie bowl with granola and fresh fruit',
    servingGrams: 350,
    calories: 380,
    protein: 28,
    ingredients: ['Greek Yogurt', 'Protein Powder', 'Banana', 'Berries', 'Granola'],
    instructions: ['Blend ingredients', 'Pour into bowl', 'Top with granola and fruit'],
  },
};

export function buildHomeSummaryDefaults() {
  return {
    fullName: 'Athlete',
    currentWeight: null,
    targetWeight: null,
    caloriesTarget: null,
    subscriptionPlan: 'Starter',
    supplements: 'No supplement notes yet.',
    consultationType: 'Not selected.',
    antiDopingFocus: 'No anti-doping focus set.',
  };
}

export function buildRecipeModalData(recipeKey) {
  const recipe = HOME_RECIPES[recipeKey];
  if (!recipe) return null;
  return {
    title: recipe.name,
    type: recipe.type,
    description: recipe.description,
    servingGrams: recipe.servingGrams,
    nutrition: {
      calories: recipe.calories,
      protein: recipe.protein,
    },
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
  };
}

function initialsFromName(name) {
  const text = String(name || '').trim();
  if (!text) return 'AT';
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

function parseApiError(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  return fallback;
}

function buildInitialState() {
  return {
    loading: true,
    error: '',
    isAuthenticated: Boolean(resolveAuthToken()),
    summary: buildHomeSummaryDefaults(),
    activeRecipeKey: '',
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: '', isAuthenticated: action.payload.isAuthenticated };
    case 'LOAD_SUCCESS':
      return { ...state, loading: false, error: '', summary: action.payload.summary };
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'OPEN_RECIPE':
      return { ...state, activeRecipeKey: action.payload };
    case 'CLOSE_RECIPE':
      return { ...state, activeRecipeKey: '' };
    default:
      return state;
  }
}

export function useClientPortalHome({ requireAuth = false } = {}) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const authenticated = Boolean(resolveAuthToken());
      dispatch({ type: 'LOAD_START', payload: { isAuthenticated: authenticated } });

      if (!authenticated && !requireAuth) {
        if (mounted) dispatch({ type: 'LOAD_SUCCESS', payload: { summary: buildHomeSummaryDefaults() } });
        return;
      }

      if (!authenticated && requireAuth) {
        if (mounted) dispatch({ type: 'LOAD_ERROR', payload: 'Please login to continue.' });
        return;
      }

      try {
        const response = await apiClient.get('/api/client/home-summary');
        const data = response?.data || {};
        const summary = {
          fullName: String(data.full_name || buildHomeSummaryDefaults().fullName),
          currentWeight: data.current_weight ?? null,
          targetWeight: data.target_weight ?? null,
          caloriesTarget: data.calories_target ?? null,
          subscriptionPlan: String(data.subscription_plan || buildHomeSummaryDefaults().subscriptionPlan),
          supplements: String(data.supplements || buildHomeSummaryDefaults().supplements),
          consultationType: String(data.consultation_type || buildHomeSummaryDefaults().consultationType),
          antiDopingFocus: String(data.anti_doping_focus || buildHomeSummaryDefaults().antiDopingFocus),
        };
        if (mounted) dispatch({ type: 'LOAD_SUCCESS', payload: { summary } });
      } catch (error) {
        if (mounted) dispatch({ type: 'LOAD_ERROR', payload: parseApiError(error, 'Failed to load personalized summary.') });
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [requireAuth]);

  const openRecipe = (key) => dispatch({ type: 'OPEN_RECIPE', payload: key });
  const closeRecipe = () => dispatch({ type: 'CLOSE_RECIPE' });

  const activeRecipe = useMemo(
    () => (state.activeRecipeKey ? buildRecipeModalData(state.activeRecipeKey) : null),
    [state.activeRecipeKey]
  );

  const avatarInitials = useMemo(() => initialsFromName(state.summary.fullName), [state.summary.fullName]);

  return {
    state,
    activeRecipe,
    avatarInitials,
    openRecipe,
    closeRecipe,
  };
}
