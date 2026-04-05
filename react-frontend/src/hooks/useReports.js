import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/api';
import { getStorage, safeJsonGet, safeJsonSet } from '../utils/storageSafe';

export function formatDateLabel(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function toNumberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildWeightTrend(weightLogs, profile = null) {
  const logs = Array.isArray(weightLogs) ? weightLogs : [];
  if (!logs.length) {
    const fallbackWeight = toNumberOrNull(profile?.weight);
    const fallbackBodyFat = toNumberOrNull(profile?.body_fat_percentage);
    return {
      latestWeight: fallbackWeight,
      bodyFat: fallbackBodyFat,
      trendText: fallbackWeight !== null ? 'Using latest profile data' : 'No data yet',
      trendDelta: 0,
    };
  }

  const latest = logs[0];
  const oldest = logs[logs.length - 1];
  const latestWeight = Number(latest?.weight ?? 0);
  const oldestWeight = Number(oldest?.weight ?? latestWeight);
  const delta = Number((latestWeight - oldestWeight).toFixed(1));

  return {
    latestWeight,
    bodyFat: toNumberOrNull(latest?.body_fat_percentage),
    trendDelta: delta,
    trendText: delta === 0 ? 'No change' : (delta > 0 ? `+${Math.abs(delta)} kg` : `-${Math.abs(delta)} kg`),
  };
}

export function buildMeasurementPayload({ currentClientId, weight, bodyFat, muscleMass }) {
  const parseNumberOrNull = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return {
    weight: Number(weight),
    body_fat_percentage: parseNumberOrNull(bodyFat),
    muscle_mass: parseNumberOrNull(muscleMass),
    notes: 'Updated from progress page',
    client_id: currentClientId,
  };
}

export function buildWorkoutPayload({ currentClientId, workoutName }) {
  return {
    workout_name: String(workoutName || '').trim(),
    workout_type: 'General',
    duration_minutes: 30,
    intensity: 'Moderate',
    calories_burned: 200,
    notes: 'Logged from progress page',
    client_id: currentClientId,
  };
}

export function buildMoodPayload({ currentClientId, moodValue }) {
  return {
    mood_level: Number(moodValue),
    energy_level: 7,
    stress_level: 4,
    notes: 'Logged from progress page',
    client_id: currentClientId,
  };
}

export function buildSleepPayload({ currentClientId, sleepHours }) {
  return {
    mood_level: 7,
    sleep_hours: Number(sleepHours),
    sleep_quality: 7,
    notes: 'Sleep logged from progress page',
    client_id: currentClientId,
  };
}

function parseApiError(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  return fallback;
}

export function useReports() {
  const local = getStorage('local');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [moodLogs, setMoodLogs] = useState([]);

  const [measurementForm, setMeasurementForm] = useState({
    weight: '',
    bodyFat: '',
    muscleMass: '',
  });

  const currentClientId = profile?.id || null;

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [profileResult, weightResult, moodResult] = await Promise.allSettled([
        apiClient.get('/api/client/profile'),
        apiClient.get('/api/client/weight', { params: { days: 90, skip: 0, limit: 50 } }),
        apiClient.get('/api/client/mood', { params: { days: 30, skip: 0, limit: 50 } }),
      ]);

      const loadedProfile = profileResult.status === 'fulfilled' ? (profileResult.value?.data || null) : null;
      const loadedWeight = weightResult.status === 'fulfilled' && Array.isArray(weightResult.value?.data)
        ? weightResult.value.data
        : [];
      const loadedMood = moodResult.status === 'fulfilled' && Array.isArray(moodResult.value?.data)
        ? moodResult.value.data
        : [];

      setProfile(loadedProfile);
      setWeightLogs(loadedWeight);
      setMoodLogs(loadedMood);

      if (loadedProfile) {
        setMeasurementForm((prev) => ({
          weight: prev.weight || (loadedProfile.weight ?? ''),
          bodyFat: prev.bodyFat || (loadedProfile.body_fat_percentage ?? ''),
          muscleMass: prev.muscleMass || (loadedProfile.skeletal_muscle ?? ''),
        }));
      }

      if (!loadedProfile && !loadedWeight.length && !loadedMood.length) {
        setError('Could not load progress data from server.');
      }
    } catch (err) {
      setError(parseApiError(err, 'Could not load progress data from server.'));
      setProfile(null);
      setWeightLogs([]);
      setMoodLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const updateMeasurementField = (field, value) => {
    setMeasurementForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveMeasurements = async () => {
    setError('');
    setMessage('');
    const weight = Number(measurementForm.weight);
    if (!currentClientId || !Number.isFinite(weight) || weight <= 0) {
      setError('Please enter a valid weight.');
      return;
    }

    setSubmitting(true);
    try {
      const bodyFatValue = measurementForm.bodyFat;
      const muscleMassValue = measurementForm.muscleMass;
      const payload = buildMeasurementPayload({
        currentClientId,
        weight: measurementForm.weight,
        bodyFat: bodyFatValue,
        muscleMass: muscleMassValue,
      });
      await apiClient.post('/api/client/weight', payload);

      // Keep profile-based pages (dashboard/settings/progress cards) in sync with latest progress entry.
      await apiClient.put('/api/client/profile', {
        weight: Number(measurementForm.weight),
        body_fat_percentage: bodyFatValue === '' ? null : Number(bodyFatValue),
        skeletal_muscle: muscleMassValue === '' ? null : Number(muscleMassValue),
      });

      if (profile) {
        const cacheIds = [profile?.user_id, profile?.id, profile?.display_id]
          .map((value) => String(value || '').trim())
          .filter(Boolean);
        cacheIds.forEach((id) => {
          const dataKey = `clientData_${id}`;
          const dashboardKey = `clientDashboardCache_${id}`;
          const fullProfileKey = `clientFullProfile_${id}`;
          safeJsonSet(local, dataKey, { ...(safeJsonGet(local, dataKey, {}) || {}), weight: Number(measurementForm.weight), body_fat_percentage: bodyFatValue === '' ? null : Number(bodyFatValue), skeletal_muscle: muscleMassValue === '' ? null : Number(muscleMassValue) });
          safeJsonSet(local, dashboardKey, { ...(safeJsonGet(local, dashboardKey, {}) || {}), weight: Number(measurementForm.weight), body_fat_percentage: bodyFatValue === '' ? null : Number(bodyFatValue), skeletal_muscle: muscleMassValue === '' ? null : Number(muscleMassValue) });
          safeJsonSet(local, fullProfileKey, { ...(safeJsonGet(local, fullProfileKey, {}) || {}), weight: Number(measurementForm.weight), body_fat_percentage: bodyFatValue === '' ? null : Number(bodyFatValue), skeletal_muscle: muscleMassValue === '' ? null : Number(muscleMassValue) });
        });
      }

      setMessage('Measurements updated successfully.');
      await refreshData();
      setMeasurementForm({
        weight: String(measurementForm.weight || ''),
        bodyFat: String(bodyFatValue || ''),
        muscleMass: String(muscleMassValue || ''),
      });
    } catch (err) {
      setError(parseApiError(err, 'Failed to save measurements.'));
    } finally {
      setSubmitting(false);
    }
  };

  const logWorkout = async (workoutName) => {
    const trimmed = String(workoutName || '').trim();
    if (!currentClientId || !trimmed) return;

    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await apiClient.post('/api/client/workouts', buildWorkoutPayload({ currentClientId, workoutName: trimmed }));
      setMessage('Workout logged successfully.');
    } catch (err) {
      setError(parseApiError(err, 'Failed to log workout.'));
    } finally {
      setSubmitting(false);
    }
  };

  const logMood = async (moodValue) => {
    const numeric = Number(moodValue);
    if (!currentClientId || !Number.isFinite(numeric) || numeric < 1 || numeric > 10) {
      setError('Mood value must be between 1 and 10.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await apiClient.post('/api/client/mood', buildMoodPayload({ currentClientId, moodValue: numeric }));
      setMessage('Mood logged successfully.');
      await refreshData();
    } catch (err) {
      setError(parseApiError(err, 'Failed to log mood.'));
    } finally {
      setSubmitting(false);
    }
  };

  const logSleep = async (sleepHours) => {
    const numeric = Number(sleepHours);
    if (!currentClientId || !Number.isFinite(numeric) || numeric <= 0) {
      setError('Please enter a valid sleep duration.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await apiClient.post('/api/client/mood', buildSleepPayload({ currentClientId, sleepHours: numeric }));
      setMessage('Sleep logged successfully.');
      await refreshData();
    } catch (err) {
      setError(parseApiError(err, 'Failed to log sleep.'));
    } finally {
      setSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    const trend = buildWeightTrend(weightLogs, profile);
    const avgMood = moodLogs.length
      ? Number((moodLogs.reduce((sum, row) => sum + Number(row?.mood_level || 0), 0) / moodLogs.length).toFixed(1))
      : null;

    const recentWeightRows = weightLogs.slice(0, 8).reverse().map((row) => ({
      label: formatDateLabel(row?.logged_at),
      weight: row?.weight,
      bodyFat: row?.body_fat_percentage,
    }));
    if (!recentWeightRows.length && (trend.latestWeight !== null || trend.bodyFat !== null)) {
      recentWeightRows.push({
        label: 'Today',
        weight: trend.latestWeight,
        bodyFat: trend.bodyFat,
      });
    }

    return {
      latestWeight: trend.latestWeight,
      bodyFat: trend.bodyFat,
      weightTrend: trend.trendText,
      avgMood,
      strengthScore: 75,
      recentWeights: recentWeightRows,
      recentMood: moodLogs.slice(0, 8).reverse().map((row) => ({
        label: formatDateLabel(row?.logged_at),
        mood: row?.mood_level,
        sleep: row?.sleep_hours,
      })),
    };
  }, [moodLogs, profile, weightLogs]);

  return {
    loading,
    submitting,
    error,
    message,
    profile,
    currentClientId,
    weightLogs,
    moodLogs,
    summary,
    measurementForm,
    updateMeasurementField,
    saveMeasurements,
    logWorkout,
    logMood,
    logSleep,
    refreshData,
  };
}
