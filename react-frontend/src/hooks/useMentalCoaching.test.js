import { describe, expect, it } from 'vitest';
import { buildProgressSummary, mentalReducer } from './useMentalCoaching';

describe('useMentalCoaching helpers', () => {
  it('builds progress summary from completed exercises', () => {
    const summary = buildProgressSummary(['breathing', 'focus'], 3);
    expect(summary.completed).toBe(2);
    expect(summary.total).toBe(3);
    expect(summary.percentage).toBeGreaterThan(60);
  });

  it('updates reducer on exercise and goal actions', () => {
    const initial = {
      weeklyGoal: 'Goal',
      completedExercises: [],
      challengeCompletedAt: '',
    };

    const withGoal = mentalReducer(initial, { type: 'SET_WEEKLY_GOAL', payload: 'New Goal' });
    expect(withGoal.weeklyGoal).toBe('New Goal');

    const withExercise = mentalReducer(withGoal, { type: 'MARK_EXERCISE_COMPLETE', payload: 'breathing' });
    expect(withExercise.completedExercises).toContain('breathing');
  });
});
