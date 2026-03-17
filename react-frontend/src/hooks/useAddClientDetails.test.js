import { describe, expect, it } from 'vitest';
import {
  addClientDetailsReducer,
  buildAddClientDetailsInitialState,
  buildAddClientDetailsPayload,
  recalcAddClientDetails,
} from './useAddClientDetails';

describe('useAddClientDetails helpers', () => {
  it('recalculates profile metrics', () => {
    const next = recalcAddClientDetails({
      ...buildAddClientDetailsInitialState(),
      birthday: '2000-01-01',
      gender: 'male',
      activityLevel: 'moderate',
      height: '180',
      weight: '80',
    });

    expect(Number(next.bmi)).toBeGreaterThan(20);
    expect(Number(next.bmr)).toBeGreaterThan(0);
    expect(Number(next.tdee)).toBeGreaterThan(0);
  });

  it('builds backend payload with training details', () => {
    const payload = buildAddClientDetailsPayload(buildAddClientDetailsInitialState());
    expect(Array.isArray(payload.training_details)).toBe(true);
    expect(payload.training_details.length).toBe(7);
  });

  it('updates reducer field state and autocalc', () => {
    const initial = buildAddClientDetailsInitialState();
    const next = addClientDetailsReducer(initial, {
      type: 'UPDATE_FIELD',
      payload: { field: 'weight', value: '80' },
    });
    expect(next.weight).toBe('80');
  });
});
