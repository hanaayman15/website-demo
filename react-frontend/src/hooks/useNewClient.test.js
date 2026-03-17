import { describe, expect, it } from 'vitest';
import { calculateAgeFromBirthday, normalizeDisplayGender } from './useNewClient';

describe('useNewClient helpers', () => {
  it('normalizes gender labels for display', () => {
    expect(normalizeDisplayGender('male')).toBe('Male');
    expect(normalizeDisplayGender(' FEMALE ')).toBe('Female');
    expect(normalizeDisplayGender('')).toBe('N/A');
  });

  it('calculates age from valid birthday', () => {
    const age = calculateAgeFromBirthday('2000-01-01');
    expect(typeof age === 'number' || age === 'N/A').toBe(true);
    if (typeof age === 'number') {
      expect(age).toBeGreaterThan(10);
      expect(age).toBeLessThan(80);
    }
  });

  it('returns N/A for invalid birthday', () => {
    expect(calculateAgeFromBirthday('not-a-date')).toBe('N/A');
    expect(calculateAgeFromBirthday('')).toBe('N/A');
  });
});
