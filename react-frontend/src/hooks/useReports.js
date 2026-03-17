import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/api';

export function formatDateLabel(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function buildWeightTrend(weightLogs) {
  const logs = Array.isArray(weightLogs) ? weightLogs : [];
  if (!logs.length) {
    return {
      latestWeight: null,
      bodyFat: null,
      trendText: 'No data yet',
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
    bodyFat: latest?.body_fat_percentage ?? null,
    trendDelta: delta,
    trendText: delta > 0 ? `+${Math.abs(delta)} kg` : `-${Math.abs(delta)} kg`,
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
      const [profileResponse, weightResponse, moodResponse] = await Promise.all([
        apiClient.get('/api/client/profile'),
        apiClient.get('/api/client/weight', { params: { days: 90, skip: 0, limit: 50 } }),
        apiClient.get('/api/client/mood', { params: { days: 30, skip: 0, limit: 50 } }),
      ]);

      setProfile(profileResponse?.data || null);
      setWeightLogs(Array.isArray(weightResponse?.data) ? weightResponse.data : []);
      setMoodLogs(Array.isArray(moodResponse?.data) ? moodResponse.data : []);
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
      const payload = buildMeasurementPayload({
        currentClientId,
        weight: measurementForm.weight,
        bodyFat: measurementForm.bodyFat,
        muscleMass: measurementForm.muscleMass,
      });
      await apiClient.post('/api/client/weight', payload);
      setMessage('Measurements updated successfully.');
      await refreshData();
      setMeasurementForm({ weight: '', bodyFat: '', muscleMass: '' });
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
    const trend = buildWeightTrend(weightLogs);
    const avgMood = moodLogs.length
      ? Number((moodLogs.reduce((sum, row) => sum + Number(row?.mood_level || 0), 0) / moodLogs.length).toFixed(1))
      : null;

    return {
      latestWeight: trend.latestWeight,
      bodyFat: trend.bodyFat,
      weightTrend: trend.trendText,
      avgMood,
      strengthScore: 75,
      recentWeights: weightLogs.slice(0, 8).reverse().map((row) => ({
        label: formatDateLabel(row?.logged_at),
        weight: row?.weight,
        bodyFat: row?.body_fat_percentage,
      })),
      recentMood: moodLogs.slice(0, 8).reverse().map((row) => ({
        label: formatDateLabel(row?.logged_at),
        mood: row?.mood_level,
        sleep: row?.sleep_hours,
      })),
    };
  }, [moodLogs, weightLogs]);

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
