import { describe, expect, it } from 'vitest';
import {
  buildDashboardInitialState,
  buildMacroState,
  buildSummary,
  buildTodayMeals,
  buildTodayMacrosPayload,
  dashboardDataReducer,
  normalizeMealStatus,
} from './useDashboardDataReducer';

function getTodayName() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

function minutesFrom12h(timeText) {
  const text = String(timeText || '').trim();
  const match = text.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const suffix = String(match[3] || '').toUpperCase();
  if (suffix === 'AM' && hours === 12) hours = 0;
  if (suffix === 'PM' && hours < 12) hours += 12;
  return (hours * 60) + minutes;
}

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

  it('schedules meals dynamically with evening training and keeps dinner 3h after post-workout', () => {
    const dayName = getTodayName();
    const profile = {
      wake_up_time: '06:30 AM',
      training_time: '06:00 PM',
      training_end_time: '08:00 PM',
      meal_swaps: {
        dayMeals: {
          [dayName]: [
            { type: 'Breakfast' },
            { type: 'Snack 1' },
            { type: 'Lunch' },
            { type: 'Dinner' },
            { type: 'Pre-Workout Snack' },
            { type: 'Post-Workout Snack' },
          ],
        },
      },
    };

    const meals = buildTodayMeals(profile);
    const byName = Object.fromEntries(meals.map((meal) => [String(meal.mealLabel || '').toLowerCase(), meal.scheduledTime]));

    expect(byName['breakfast']).toBe('07:00 AM');
    expect(byName['snack 1']).toBe('10:00 AM');
    expect(byName['lunch']).toBe('01:00 PM');
    expect(byName['pre-workout snack']).toBe('05:15 PM');
    expect(byName['post-workout snack']).toBe('08:30 PM');
    expect(byName['dinner']).toBe('11:30 PM');

    const pre = minutesFrom12h(byName['pre-workout snack']);
    const trainStart = minutesFrom12h('06:00 PM');
    const post = minutesFrom12h(byName['post-workout snack']);
    const trainEnd = minutesFrom12h('08:00 PM');
    const dinner = minutesFrom12h(byName['dinner']);

    expect(pre).toBeLessThan(trainStart);
    expect(post).toBeGreaterThan(trainEnd);
    expect(dinner).toBe(post + 180);
  });

  it('keeps pre and post workout first when training is in the morning', () => {
    const dayName = getTodayName();
    const profile = {
      wake_up_time: '06:30 AM',
      training_time: '07:00 AM',
      training_end_time: '08:00 AM',
      meal_swaps: {
        dayMeals: {
          [dayName]: [
            { type: 'Breakfast' },
            { type: 'Snack 1' },
            { type: 'Lunch' },
            { type: 'Dinner' },
            { type: 'Pre-Workout Snack' },
            { type: 'Post-Workout Snack' },
          ],
        },
      },
    };

    const meals = buildTodayMeals(profile);
    const labels = meals.map((meal) => String(meal.mealLabel || '').toLowerCase());
    const preIndex = labels.indexOf('pre-workout snack');
    const postIndex = labels.indexOf('post-workout snack');

    expect(preIndex).toBe(0);
    expect(postIndex).toBe(1);
  });
});
