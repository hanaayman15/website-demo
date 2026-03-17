import { describe, expect, it } from 'vitest';
import {
  WEEK_DAYS,
  buildInitialProgramsState,
  buildProgramsPayload,
  normalizeProgramsSource,
  programsReducer,
} from './useClientDetailReducer';

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
});
