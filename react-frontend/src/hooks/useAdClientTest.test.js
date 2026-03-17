import { describe, expect, it } from 'vitest';
import {
  adClientTestReducer,
  buildAdClientTestInitialState,
  buildAdClientTestPayload,
  calculateAdClientMetrics,
} from './useAdClientTest';

describe('useAdClientTest helpers', () => {
  it('calculates metrics from anthropometrics', () => {
    const next = calculateAdClientMetrics({
      ...buildAdClientTestInitialState(),
      birthday: '2000-01-01',
      gender: 'Male',
      height: '178',
      weight: '75',
      activityLevel: 'moderate',
    });

    expect(Number(next.bmi)).toBeGreaterThan(20);
    expect(Number(next.tdee)).toBeGreaterThan(0);
    expect(Number(next.protein)).toBeGreaterThan(0);
  });

  it('builds payload shape for migration harness', () => {
    const payload = buildAdClientTestPayload({
      ...buildAdClientTestInitialState(),
      fullName: 'User',
      height: '180',
      weight: '80',
    });

    expect(payload.full_name).toBe('User');
    expect(payload.height).toBe(180);
    expect(payload.weight).toBe(80);
  });

  it('supports reducer autofill transition', () => {
    const initial = buildAdClientTestInitialState();
    const next = adClientTestReducer(initial, { type: 'AUTOFILL' });
    expect(next.fullName).toContain('Autofill');
  });
});
