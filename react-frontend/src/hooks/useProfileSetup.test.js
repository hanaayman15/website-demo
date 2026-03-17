import { describe, expect, it } from 'vitest';
import { fullNameIsValid } from './useProfileSetup';

describe('useProfileSetup helpers', () => {
  it('validates full names with at least four parts', () => {
    expect(fullNameIsValid('One Two Three Four')).toBe(true);
    expect(fullNameIsValid('One Two Three')).toBe(false);
    expect(fullNameIsValid('   ')).toBe(false);
  });
});
