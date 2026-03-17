import { describe, expect, it } from 'vitest';
import {
  buildClientNutritionProfileInitialState,
  buildNutritionDraftKey,
  buildNutritionFields,
  buildNutritionPayload,
  calculateNutritionDerived,
  clientNutritionProfileReducer,
  getCaloriesLabel,
} from './useClientNutritionProfile';

describe('useClientNutritionProfile helpers', () => {
  it('calculates derived metrics from base measurements', () => {
    const result = calculateNutritionDerived({
      height: '180',
      weight: '80',
      bodyFat: '15',
      skeletalMuscle: '36',
      activityLevel: 'moderately_active',
      progressionType: 'maintain',
      competitionDate: '',
      bmi: '',
      bodyFatMass: '',
      musclePercent: '',
      bmr: '',
      tdee: '',
      calories: '',
      protein: '',
      carbs: '',
      fats: '',
      waterIntake: '',
      daysLeft: '',
    });

    expect(Number(result.bmi)).toBeGreaterThan(20);
    expect(Number(result.tdee)).toBeGreaterThan(0);
    expect(Number(result.calories)).toBeGreaterThan(0);
  });

  it('builds backend nutrition payload shape', () => {
    const payload = buildNutritionPayload({
      fields: buildNutritionFields({ height: 180, weight: 80, activityLevel: 'very_active' }),
      trainingSessions: [],
      supplements: [{ name: 'Creatine', amount: '5', notes: '' }],
    });

    expect(payload.height).toBe(180);
    expect(payload.weight).toBe(80);
    expect(Array.isArray(payload.supplements)).toBe(true);
  });

  it('exposes stable labels and draft key helper', () => {
    expect(getCaloriesLabel('cut')).toContain('Cut');
    expect(buildNutritionDraftKey('99')).toContain('99');
  });

  it('supports reducer transitions for field updates', () => {
    const initial = buildClientNutritionProfileInitialState();
    const loaded = clientNutritionProfileReducer(initial, {
      type: 'LOAD_SUCCESS',
      payload: {
        fields: buildNutritionFields({ weight: '80' }),
        trainingSessions: [],
        supplements: [],
      },
    });
    const next = clientNutritionProfileReducer(loaded, {
      type: 'SET_FIELD',
      payload: { field: 'height', value: '180' },
    });

    expect(next.fields.height).toBe('180');
  });
});
