import { describe, expect, it } from 'vitest';
import {
  buildClientRecipesInitialState,
  clientRecipesReducer,
  CLIENT_RECIPES,
  filterRecipes,
  normalizeRecipeTypeLabel,
} from './useClientRecipes';

describe('useClientRecipes helpers', () => {
  it('filters recipes by type and search text', () => {
    const result = filterRecipes(CLIENT_RECIPES, { filter: 'breakfast', search: 'berries' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.type === 'breakfast')).toBe(true);
  });

  it('normalizes recipe labels', () => {
    expect(normalizeRecipeTypeLabel('post-workout')).toBe('Post Workout');
  });

  it('updates reducer state transitions', () => {
    const initial = buildClientRecipesInitialState();
    const next = clientRecipesReducer(initial, { type: 'SET_FILTER', payload: 'lunch' });
    expect(next.activeFilter).toBe('lunch');
  });
});
