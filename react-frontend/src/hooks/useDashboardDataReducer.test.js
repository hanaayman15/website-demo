import { describe, expect, it } from 'vitest';
import {
  buildDashboardInitialState,
  buildMacroState,
  buildSummary,
  buildTodayMacrosPayload,
  dashboardDataReducer,
  normalizeMealStatus,
} from './useDashboardDataReducer';

describe('useDashboardDataReducer', () => {
  it('normalizes meal status values to backend-compatible values', () => {
    expect(normalizeMealStatus('completed')).toBe('completed');
    expect(normalizeMealStatus('pending')).toBe('not-completed');
    expect(normalizeMealStatus('in-progress')).toBe('not-completed');
  });

  it('builds macro state from completed meals only', () => {
    const profile = { protein_target: 200, carbs_target: 300, fats_target: 80, tdee: 2800 };
    const todayMeals = [
      { mealId: 'm-1', protein: 40, carbs: 60, fats: 20, calories: 600 },
      { mealId: 'm-2', protein: 30, carbs: 40, fats: 10, calories: 400 },
    ];
    const mealStatuses = { 'm-1': 'completed', 'm-2': 'not-completed' };

    const macro = buildMacroState(profile, todayMeals, mealStatuses);

    expect(macro.consumed.protein).toBe(40);
    expect(macro.consumed.carbs).toBe(60);
    expect(macro.completeMeals).toBe(1);
    expect(macro.pendingMeals).toBe(1);
  });

  it('builds today macros payload with expected API keys', () => {
    const payload = buildTodayMacrosPayload(
      [{ mealId: 'm-1', mealKey: 'breakfast', mealLabel: 'Breakfast', scheduledTime: '8:00 AM', protein: 20, carbs: 30, fats: 10, calories: 300 }],
      { 'm-1': 'completed' },
      {
        target: { calories: 2000, protein: 150, carbs: 250, fats: 70 },
        consumed: { calories: 300, protein: 20, carbs: 30, fats: 10 },
      }
    );

    expect(payload).toHaveProperty('target_calories', 2000);
    expect(payload.meals[0]).toHaveProperty('meal_id', 'm-1');
    expect(payload.meals[0]).toHaveProperty('status', 'completed');
  });

  it('reducer handles loading and backend macro updates', () => {
    let state = buildDashboardInitialState();

    state = dashboardDataReducer(state, { type: 'LOAD_START' });
    expect(state.loading).toBe(true);

    state = dashboardDataReducer(state, {
      type: 'LOAD_SUCCESS',
      payload: {
        profile: { full_name: 'Client X' },
        todayMeals: [],
        mealStatuses: {},
        macro: {
          target: { calories: 1000, protein: 100, carbs: 100, fats: 30 },
          consumed: { calories: 0, protein: 0, carbs: 0, fats: 0 },
          totalMeals: 0,
          completeMeals: 0,
          pendingMeals: 0,
        },
      },
    });
    expect(state.loading).toBe(false);

    state = dashboardDataReducer(state, {
      type: 'SET_BACKEND_MACRO',
      payload: {
        consumed_calories: 500,
        consumed_protein: 35,
        consumed_carbs: 70,
        consumed_fats: 18,
        complete_meals: 2,
        total_meals: 4,
      },
    });

    expect(state.macro.consumed.calories).toBe(500);
    expect(state.macro.completeMeals).toBe(2);
    expect(state.macro.totalMeals).toBe(4);
  });

  it('buildSummary computes fallback calories from macros when tdee absent', () => {
    const summary = buildSummary({ protein_target: 100, carbs_target: 200, fats_target: 50 });
    expect(summary.targetCalories).toBe(100 * 4 + 200 * 4 + 50 * 9);
  });
});
