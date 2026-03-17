import { useMemo, useReducer } from 'react';

export const CLIENT_RECIPES = [
  {
    id: 1,
    name: 'Oatmeal with Berries',
    type: 'breakfast',
    description: 'Nutritious oatmeal topped with fresh berries for a perfect start',
    image: '🥣',
    ingredients: ['Oats', 'Blueberries', 'Strawberries', 'Honey', 'Milk'],
    instructions: '1. Cook oats\n2. Top with berries\n3. Add honey',
    nutrition: { protein: 10, carbs: 45, fats: 5, calories: 280 },
    servingGrams: 320,
  },
  {
    id: 2,
    name: 'Grilled Chicken Breast with Vegetables',
    type: 'lunch',
    description: 'Lean protein with colorful steamed vegetables',
    image: '🍗',
    ingredients: ['Chicken Breast', 'Broccoli', 'Carrots', 'Olive Oil', 'Garlic'],
    instructions: '1. Season chicken\n2. Grill for 20 mins\n3. Steam vegetables',
    nutrition: { protein: 35, carbs: 20, fats: 8, calories: 350 },
    servingGrams: 410,
  },
  {
    id: 3,
    name: 'Greek Salad',
    type: 'lunch',
    description: 'Fresh vegetables with feta cheese and olive oil dressing',
    image: '🥗',
    ingredients: ['Tomatoes', 'Cucumbers', 'Feta', 'Olives', 'Olive Oil'],
    instructions: '1. Chop vegetables\n2. Add feta\n3. Drizzle olive oil',
    nutrition: { protein: 8, carbs: 12, fats: 12, calories: 180 },
    servingGrams: 280,
  },
  {
    id: 4,
    name: 'Salmon with Sweet Potato',
    type: 'dinner',
    description: 'Omega-3 rich salmon with roasted sweet potato',
    image: '🐟',
    ingredients: ['Salmon', 'Sweet Potato', 'Lemon', 'Olive Oil', 'Herbs'],
    instructions: '1. Season salmon\n2. Bake at 400°F\n3. Roast sweet potato',
    nutrition: { protein: 30, carbs: 35, fats: 15, calories: 450 },
    servingGrams: 430,
  },
  {
    id: 5,
    name: 'Protein Smoothie Bowl',
    type: 'breakfast',
    description: 'Protein-packed smoothie bowl with granola and nuts',
    image: '🍓',
    ingredients: ['Greek Yogurt', 'Protein Powder', 'Berries', 'Granola', 'Almonds'],
    instructions: '1. Blend yogurt and protein\n2. Pour into bowl\n3. Top with granola',
    nutrition: { protein: 25, carbs: 40, fats: 8, calories: 380 },
    servingGrams: 350,
  },
  {
    id: 6,
    name: 'Banana with Almonds',
    type: 'snack',
    description: 'Quick snack combining carbs and protein',
    image: '🍌',
    ingredients: ['Banana', 'Almonds', 'Honey'],
    instructions: '1. Slice banana\n2. Serve with almonds\n3. Optional honey drizzle',
    nutrition: { protein: 8, carbs: 25, fats: 10, calories: 220 },
    servingGrams: 190,
  },
  {
    id: 7,
    name: 'Pre-Workout Energy Bite',
    type: 'pre-workout',
    description: 'Quick carbs and electrolytes before training',
    image: '⚡',
    ingredients: ['Dates', 'Banana', 'Peanut Butter', 'Coconut'],
    instructions: '1. Mix dates and banana\n2. Roll in coconut\n3. Eat 30 mins before workout',
    nutrition: { protein: 6, carbs: 35, fats: 8, calories: 250 },
    servingGrams: 160,
  },
  {
    id: 8,
    name: 'Post-Workout Recovery Shake',
    type: 'post-workout',
    description: 'Protein and carbs for immediate post-workout recovery',
    image: '🥤',
    ingredients: ['Whey Protein', 'Rice Cakes', 'Banana', 'Double Cream Milk'],
    instructions: '1. Blend protein powder\n2. Add banana\n3. Use milk\n4. Drink immediately',
    nutrition: { protein: 30, carbs: 40, fats: 5, calories: 380 },
    servingGrams: 420,
  },
  {
    id: 9,
    name: 'Cottage Cheese with Fruits',
    type: 'snack',
    description: 'High protein snack with fresh fruits',
    image: '🍑',
    ingredients: ['Cottage Cheese', 'Peaches', 'Honey', 'Granola'],
    instructions: '1. Scoop cottage cheese\n2. Top with peaches\n3. Add honey and granola',
    nutrition: { protein: 15, carbs: 20, fats: 3, calories: 180 },
    servingGrams: 230,
  },
  {
    id: 10,
    name: 'Turkey Wrap',
    type: 'lunch',
    description: 'Lean deli turkey with fresh vegetables in whole wheat wrap',
    image: '🌯',
    ingredients: ['Turkey Breast', 'Whole Wheat Wrap', 'Lettuce', 'Tomato', 'Mustard'],
    instructions: '1. Layer wrap\n2. Add turkey\n3. Add vegetables\n4. Roll tightly',
    nutrition: { protein: 20, carbs: 30, fats: 6, calories: 300 },
    servingGrams: 300,
  },
  {
    id: 11,
    name: 'Steak Power Bowl',
    type: 'lunch',
    description: 'Grilled ribeye steak with sweet potato, roasted broccoli, and garlic butter sauce',
    image: '🥩',
    ingredients: ['Ribeye Steak', 'Sweet Potato', 'Broccoli', 'Garlic', 'Butter', 'Sea Salt', 'Black Pepper'],
    instructions: '1. Grill ribeye steak\n2. Roast sweet potato and broccoli\n3. Dice steak\n4. Arrange in bowl\n5. Drizzle with garlic butter',
    nutrition: { protein: 38, carbs: 40, fats: 14, calories: 520 },
    servingGrams: 460,
  },
  {
    id: 12,
    name: 'White Fish with Brown Rice',
    type: 'dinner',
    description: 'Lean white fish with complex carbs',
    image: '🐠',
    ingredients: ['White Fish', 'Brown Rice', 'Asparagus', 'Lemon', 'Olive Oil'],
    instructions: '1. Steam fish\n2. Cook brown rice\n3. Steam asparagus',
    nutrition: { protein: 28, carbs: 38, fats: 8, calories: 420 },
    servingGrams: 390,
  },
];

export function normalizeRecipeType(type) {
  return String(type || '').trim().toLowerCase();
}

export function normalizeRecipeTypeLabel(type) {
  const value = normalizeRecipeType(type);
  if (!value) return 'Unknown';
  return value
    .split('-')
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
    .join(' ');
}

export function filterRecipes(recipes, { filter = 'all', search = '' } = {}) {
  const normalizedFilter = normalizeRecipeType(filter) || 'all';
  const normalizedSearch = String(search || '').trim().toLowerCase();

  const byType = normalizedFilter === 'all'
    ? recipes
    : recipes.filter((recipe) => normalizeRecipeType(recipe.type) === normalizedFilter);

  if (!normalizedSearch) {
    return byType;
  }

  return byType.filter((recipe) => {
    const haystack = [
      recipe.name,
      recipe.description,
      ...(Array.isArray(recipe.ingredients) ? recipe.ingredients : []),
    ].join(' ').toLowerCase();

    return haystack.includes(normalizedSearch);
  });
}

export function buildClientRecipesInitialState() {
  return {
    activeFilter: 'all',
    search: '',
    activeRecipeId: null,
  };
}

export function clientRecipesReducer(state, action) {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, activeFilter: normalizeRecipeType(action.payload) || 'all' };
    case 'SET_SEARCH':
      return { ...state, search: String(action.payload || '') };
    case 'OPEN_RECIPE':
      return { ...state, activeRecipeId: action.payload };
    case 'CLOSE_RECIPE':
      return { ...state, activeRecipeId: null };
    default:
      return state;
  }
}

export function useClientRecipes() {
  const [state, dispatch] = useReducer(clientRecipesReducer, undefined, buildClientRecipesInitialState);

  const visibleRecipes = useMemo(
    () => filterRecipes(CLIENT_RECIPES, { filter: state.activeFilter, search: state.search }),
    [state.activeFilter, state.search]
  );

  const activeRecipe = useMemo(
    () => CLIENT_RECIPES.find((recipe) => recipe.id === state.activeRecipeId) || null,
    [state.activeRecipeId]
  );

  return {
    state,
    visibleRecipes,
    activeRecipe,
    setFilter: (filter) => dispatch({ type: 'SET_FILTER', payload: filter }),
    setSearch: (search) => dispatch({ type: 'SET_SEARCH', payload: search }),
    openRecipe: (recipeId) => dispatch({ type: 'OPEN_RECIPE', payload: recipeId }),
    closeRecipe: () => dispatch({ type: 'CLOSE_RECIPE' }),
  };
}
