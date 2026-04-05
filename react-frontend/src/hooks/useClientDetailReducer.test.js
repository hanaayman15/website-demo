import { describe, expect, it } from 'vitest';
import {
  WEEK_DAYS,
  buildInitialProgramsState,
  buildProgramsPayload,
  normalizeProgramsSource,
  programsReducer,
} from './useClientDetailReducer';

function minutesFrom12h(timeText) {
  const text = String(timeText || '').trim();
  const match = text.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const mins = Number(match[2]);
  const suffix = String(match[3]).toUpperCase();
  if (!Number.isFinite(hours) || !Number.isFinite(mins)) return null;
  if (suffix === 'AM' && hours === 12) hours = 0;
  if (suffix === 'PM' && hours < 12) hours += 12;
  return hours * 60 + mins;
}

describe('useClientDetailReducer', () => {
  it('buildInitialProgramsState creates empty meals for all week days', () => {
    const state = buildInitialProgramsState();
    expect(Object.keys(state.dayMeals)).toEqual(WEEK_DAYS);
    expect(state.programFields.notesText).toBe('');
  });

  it('supports addMeal/updateMeal/removeMeal/updateNotes actions', () => {
    let state = buildInitialProgramsState();

    state = programsReducer(state, { type: 'ADD_MEAL', payload: { dayName: 'Monday' } });
    expect(state.dayMeals.Monday).toHaveLength(1);

    const added = state.dayMeals.Monday[0];

    state = programsReducer(state, {
      type: 'UPDATE_MEAL',
      payload: { dayName: 'Monday', mealId: added.id, field: 'type', value: 'Breakfast' },
    });
    expect(state.dayMeals.Monday[0].type).toBe('Breakfast');

    state = programsReducer(state, { type: 'UPDATE_NOTES', payload: 'Phase 3 notes' });
    expect(state.programFields.notesText).toBe('Phase 3 notes');

    state = programsReducer(state, {
      type: 'REMOVE_MEAL',
      payload: { dayName: 'Monday', mealId: added.id },
    });
    expect(state.dayMeals.Monday).toHaveLength(0);
  });

  it('normalizes source fields and builds persistence payload', () => {
    const normalized = normalizeProgramsSource(
      {
        dayMeals: {
          Monday: [{ type: 'Lunch', time: '2:00 PM', en: 'Rice', ar: 'ارز' }],
        },
        programFields: {
          notesText: 'Saved notes',
          competitionEnabled: true,
        },
      },
      {
        mental_observation: 'Focus improved',
      }
    );

    const initialized = programsReducer(buildInitialProgramsState(), {
      type: 'INIT_FROM_SOURCE',
      payload: normalized,
    });

    const payload = buildProgramsPayload(initialized);

    expect(payload.notesText).toBe('Saved notes');
    expect(payload.mealSwapsPayload.dayMeals.Monday[0].type).toBe('Lunch');
    expect(payload.mealSwapsPayload.programFields.competitionEnabled).toBe(true);
  });

  it('applies dynamic schedule for evening training and keeps dinner 3h after post-workout', () => {
    const state = programsReducer(buildInitialProgramsState(), {
      type: 'APPLY_DIET_PLAN',
      payload: {
        selectedPlanIndex: 0,
        scheduleContext: {
          wakeUpTime: '06:30 AM',
          trainingTime: '06:00 PM',
          trainingEndTime: '08:00 PM',
        },
        plan: {
          monday: {
            breakfast: { en: 'Eggs' },
            snack1: { en: 'Fruit' },
            lunch: { en: 'Chicken rice' },
            dinner: { en: 'Fish' },
            preworkout: { en: 'Banana' },
            postworkout: { en: 'Shake' },
          },
        },
      },
    });

    const monday = state.dayMeals.Monday;
    const byType = Object.fromEntries(monday.map((meal) => [String(meal.type).toLowerCase(), meal.time]));

    expect(byType['breakfast']).toBe('07:00 AM');
    expect(byType['pre-workout snack']).toBe('05:15 PM');
    expect(byType['post-workout snack']).toBe('08:30 PM');
    expect(byType.dinner).toBe('11:30 PM');

    const pre = minutesFrom12h(byType['pre-workout snack']);
    const trainingStart = minutesFrom12h('06:00 PM');
    const post = minutesFrom12h(byType['post-workout snack']);
    const trainingEnd = minutesFrom12h('08:00 PM');
    const dinner = minutesFrom12h(byType.dinner);

    expect(pre).toBeLessThan(trainingStart);
    expect(post).toBeGreaterThan(trainingEnd);
    expect(dinner).toBe(post + 180);
  });

  it('handles morning and late-night training edge schedules', () => {
    const morning = programsReducer(buildInitialProgramsState(), {
      type: 'APPLY_DIET_PLAN',
      payload: {
        selectedPlanIndex: 0,
        scheduleContext: {
          wakeUpTime: '06:30 AM',
          trainingTime: '07:00 AM',
          trainingEndTime: '08:00 AM',
        },
        plan: {
          monday: {
            breakfast: { en: 'Eggs' },
            snack1: { en: 'Fruit' },
            lunch: { en: 'Chicken rice' },
            dinner: { en: 'Fish' },
            preworkout: { en: 'Banana' },
            postworkout: { en: 'Shake' },
          },
        },
      },
    });

    const morningByType = Object.fromEntries(morning.dayMeals.Monday.map((meal) => [String(meal.type).toLowerCase(), meal.time]));
    const morningOrder = morning.dayMeals.Monday.map((meal) => String(meal.type).toLowerCase());

    expect(morningByType['pre-workout snack']).toBe('06:15 AM');
    expect(morningByType['post-workout snack']).toBe('08:30 AM');
    expect(morningOrder.indexOf('pre-workout snack')).toBeLessThan(morningOrder.indexOf('post-workout snack'));

    const late = programsReducer(buildInitialProgramsState(), {
      type: 'APPLY_DIET_PLAN',
      payload: {
        selectedPlanIndex: 0,
        scheduleContext: {
          wakeUpTime: '07:00 AM',
          trainingTime: '10:00 PM',
          trainingEndTime: '11:00 PM',
        },
        plan: {
          monday: {
            breakfast: { en: 'Eggs' },
            snack1: { en: 'Fruit' },
            lunch: { en: 'Chicken rice' },
            dinner: { en: 'Fish' },
            preworkout: { en: 'Banana' },
            postworkout: { en: 'Shake' },
          },
        },
      },
    });

    const lateByType = Object.fromEntries(late.dayMeals.Monday.map((meal) => [String(meal.type).toLowerCase(), meal.time]));
    expect(lateByType['pre-workout snack']).toBe('09:15 PM');
    expect(lateByType['post-workout snack']).toBe('11:30 PM');
    expect(lateByType.dinner).toBe('02:30 AM');
  });
});
