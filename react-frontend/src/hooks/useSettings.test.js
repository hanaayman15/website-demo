import { describe, expect, it } from 'vitest';
import { buildFullProfilePayload, buildPersonalInfoPayload } from './useSettings';

describe('useSettings helpers', () => {
  it('builds personal info payload with trimmed fields', () => {
    const payload = buildPersonalInfoPayload({
      fullName: '  John Doe Smith Jones ',
      phone: ' +20 123 ',
      country: ' Egypt ',
    });
    expect(payload.full_name).toBe('John Doe Smith Jones');
    expect(payload.phone).toBe('+20 123');
    expect(payload.country).toBe('Egypt');
  });

  it('builds full profile payload and normalizes empty values to null', () => {
    const payload = buildFullProfilePayload({
      fullName: 'John Doe Smith Jones',
      phone: '',
      birthday: '',
      gender: 'male',
      country: 'Egypt',
      club: '',
      sport: 'Football',
      height: '180',
      weight: '82.5',
      bodyFat: '',
      skeletalMuscle: '42.1',
      activityLevel: 'moderately_active',
      goalWeight: '',
      foodAllergies: '',
      injuries: '',
      foodLikes: 'Rice',
      foodDislikes: '',
      additionalNotes: '',
    });

    expect(payload.phone).toBe(null);
    expect(payload.height).toBe(180);
    expect(payload.weight).toBe(82.5);
    expect(payload.body_fat_percentage).toBe(null);
    expect(payload.skeletal_muscle).toBe(42.1);
    expect(payload.goal_weight).toBe(null);
  });
});
