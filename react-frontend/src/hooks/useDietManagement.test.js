import { describe, expect, it } from 'vitest';
import {
  buildDietManagementInitialState,
  buildDietPlanDraft,
  buildDietPlanPayload,
  buildDietPlanSummary,
  dietManagementReducer,
} from './useDietManagement';

describe('useDietManagement helpers', () => {
  it('builds draft with day and meal structure', () => {
    const draft = buildDietPlanDraft();
    expect(draft.sunday.breakfast).toBeTruthy();
    expect(draft.friday.postworkout).toBeTruthy();
  });

  it('builds payload and summary', () => {
    const payload = buildDietPlanPayload({ ...buildDietPlanDraft(), minCalories: '1500', maxCalories: '2000', dietType: 'summer' });
    const summary = buildDietPlanSummary(payload);
    expect(summary.caloriesLabel).toContain('1500-2000');
    expect(summary.totalMeals).toBeGreaterThan(10);
  });

  it('supports reducer open/create transition', () => {
    const initial = buildDietManagementInitialState();
    const next = dietManagementReducer(initial, { type: 'OPEN_CREATE' });
    expect(next.modalOpen).toBe(true);
  });
});
