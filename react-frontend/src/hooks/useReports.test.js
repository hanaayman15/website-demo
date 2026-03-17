import { describe, expect, it } from 'vitest';
import {
  buildMeasurementPayload,
  buildMoodPayload,
  buildSleepPayload,
  buildWeightTrend,
  buildWorkoutPayload,
} from './useReports';

describe('useReports helpers', () => {
  it('builds trend details from weight logs', () => {
    const trend = buildWeightTrend([
      { weight: 82.4, body_fat_percentage: 17 },
      { weight: 83.1, body_fat_percentage: 18 },
    ]);
    expect(trend.latestWeight).toBe(82.4);
    expect(trend.bodyFat).toBe(17);
    expect(typeof trend.trendText).toBe('string');
  });

  it('builds measurement payload shape', () => {
    const payload = buildMeasurementPayload({
      currentClientId: 7,
      weight: '80.5',
      bodyFat: '16.2',
      muscleMass: '',
    });
    expect(payload.weight).toBe(80.5);
    expect(payload.body_fat_percentage).toBe(16.2);
    expect(payload.muscle_mass).toBe(null);
    expect(payload.client_id).toBe(7);
  });

  it('builds workout/mood/sleep payload shapes', () => {
    expect(buildWorkoutPayload({ currentClientId: 1, workoutName: 'Run' }).workout_name).toBe('Run');
    expect(buildMoodPayload({ currentClientId: 1, moodValue: 8 }).mood_level).toBe(8);
    expect(buildSleepPayload({ currentClientId: 1, sleepHours: 7.5 }).sleep_hours).toBe(7.5);
  });
});
