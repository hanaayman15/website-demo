import { describe, expect, it } from 'vitest';
import {
  buildHomeSummaryDefaults,
  buildRecipeModalData,
} from './useClientPortalHome';

describe('useClientPortalHome helpers', () => {
  it('builds default summary shape', () => {
    const defaults = buildHomeSummaryDefaults();
    expect(defaults.fullName).toBeTruthy();
    expect(defaults.subscriptionPlan).toBeTruthy();
  });

  it('builds recipe modal data from recipe key', () => {
    const recipe = buildRecipeModalData('steak');
    expect(recipe).toBeTruthy();
    expect(recipe.title).toContain('Steak');
    expect(recipe.nutrition.calories).toBeGreaterThan(0);
  });
});
