import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import { fullNameIsValid } from './useProfileSetup';

const NOTIFICATION_PREFS_KEY = 'clientNotificationPrefs';

const DEFAULT_PREFS = {
  emailNotifications: true,
  smsReminders: true,
  progressReports: true,
};

function syncProfileCaches(profile) {
  if (!profile) return;
  const id = profile?.display_id || profile?.id;
  if (!id) return;

  try {
    const key = `clientData_${id}`;
    const raw = localStorage.getItem(key);
    const existing = raw ? JSON.parse(raw) : {};
    localStorage.setItem(key, JSON.stringify({ ...existing, ...profile }));
  } catch {
    // Ignore cache sync issues.
  }

  try {
    const key = `clientDashboardCache_${id}`;
    const raw = localStorage.getItem(key);
    const existing = raw ? JSON.parse(raw) : {};
    localStorage.setItem(key, JSON.stringify({ ...existing, ...profile }));
  } catch {
    // Ignore cache sync issues.
  }
}

export function buildPersonalInfoPayload(personalForm) {
  return {
    full_name: String(personalForm.fullName || '').trim(),
    phone: String(personalForm.phone || '').trim(),
    country: String(personalForm.country || '').trim(),
  };
}

export function buildFullProfilePayload(fullProfileForm) {
  const parseNumber = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const sanitize = (value) => {
    const trimmed = String(value || '').trim();
    return trimmed ? trimmed : null;
  };

  return {
    full_name: String(fullProfileForm.fullName || '').trim(),
    phone: sanitize(fullProfileForm.phone),
    birthday: sanitize(fullProfileForm.birthday),
    gender: sanitize(fullProfileForm.gender),
    country: sanitize(fullProfileForm.country),
    club: sanitize(fullProfileForm.club),
    sport: sanitize(fullProfileForm.sport),
    height: parseNumber(fullProfileForm.height),
    weight: parseNumber(fullProfileForm.weight),
    body_fat_percentage: parseNumber(fullProfileForm.bodyFat),
    skeletal_muscle: parseNumber(fullProfileForm.skeletalMuscle),
    activity_level: sanitize(fullProfileForm.activityLevel),
    goal_weight: parseNumber(fullProfileForm.goalWeight),
    food_allergies: sanitize(fullProfileForm.foodAllergies),
    injuries: sanitize(fullProfileForm.injuries),
    food_likes: sanitize(fullProfileForm.foodLikes),
    food_dislikes: sanitize(fullProfileForm.foodDislikes),
    additional_notes: sanitize(fullProfileForm.additionalNotes),
  };
}

function parseApiError(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  return fallback;
}

function readNotificationPrefs() {
  try {
    const raw = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? { ...DEFAULT_PREFS, ...parsed } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function useSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState(null);
  const [currentPlan, setCurrentPlan] = useState('Starter');

  const [personalForm, setPersonalForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
  });

  const [fullProfileForm, setFullProfileForm] = useState({
    fullName: '',
    phone: '',
    birthday: '',
    gender: '',
    country: '',
    club: '',
    sport: '',
    height: '',
    weight: '',
    bodyFat: '',
    skeletalMuscle: '',
    activityLevel: '',
    goalWeight: '',
    foodAllergies: '',
    injuries: '',
    foodLikes: '',
    foodDislikes: '',
    additionalNotes: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationPrefs, setNotificationPrefs] = useState(readNotificationPrefs);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/api/client/profile');
      const data = response?.data || null;
      setProfile(data);
      syncProfileCaches(data);

      const planNames = {
        starter: 'Starter',
        pro: 'Pro',
        elite: 'Elite',
      };
      const selectedPlan = localStorage.getItem('subscriptionPlan') || localStorage.getItem('selectedPlan') || 'starter';
      setCurrentPlan(planNames[selectedPlan] || 'Starter');

      setPersonalForm({
        fullName: data?.full_name || '',
        email: data?.email || '',
        phone: data?.phone || '',
        country: data?.country || '',
      });

      setFullProfileForm({
        fullName: data?.full_name || '',
        phone: data?.phone || '',
        birthday: data?.birthday || '',
        gender: data?.gender || '',
        country: data?.country || '',
        club: data?.club || '',
        sport: data?.sport || '',
        height: data?.height ?? '',
        weight: data?.weight ?? '',
        bodyFat: data?.body_fat_percentage ?? '',
        skeletalMuscle: data?.skeletal_muscle ?? '',
        activityLevel: data?.activity_level || '',
        goalWeight: data?.goal_weight ?? '',
        foodAllergies: data?.food_allergies || '',
        injuries: data?.injuries || '',
        foodLikes: data?.food_likes || '',
        foodDislikes: data?.food_dislikes || '',
        additionalNotes: data?.additional_notes || '',
      });
    } catch (err) {
      setError(parseApiError(err, 'Failed to load profile data.'));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const updatePersonalField = (field, value) => {
    setPersonalForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateFullProfileField = (field, value) => {
    setFullProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const updatePasswordField = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateNotificationPref = (field, value) => {
    setNotificationPrefs((prev) => {
      const next = { ...prev, [field]: Boolean(value) };
      localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const savePersonalInfo = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!fullNameIsValid(personalForm.fullName)) {
      setError('Please enter at least 4 names for full name.');
      return;
    }

    setSaving(true);
    try {
      const payload = buildPersonalInfoPayload(personalForm);
      await apiClient.put('/api/client/profile', payload);
      setMessage('Personal information updated successfully.');
      await refreshProfile();
    } catch (err) {
      setError(parseApiError(err, 'Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  const saveFullProfile = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!fullNameIsValid(fullProfileForm.fullName)) {
      setError('Please enter at least 4 names for full name.');
      return;
    }

    setSaving(true);
    try {
      const payload = buildFullProfilePayload(fullProfileForm);
      await apiClient.put('/api/client/profile', payload);
      setMessage('Profile updated successfully.');
      await refreshProfile();
    } catch (err) {
      setError(parseApiError(err, 'Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/api/auth/change-password', {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });
      setMessage('Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(parseApiError(err, 'Failed to change password.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteAccountLocal = () => {
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const currentClientId = localStorage.getItem('currentClientId');
    const updated = Array.isArray(clients)
      ? clients.filter((client) => Number(client?.id) !== Number(currentClientId))
      : [];
    localStorage.setItem('clients', JSON.stringify(updated));
    localStorage.removeItem('currentClientId');
  };

  return {
    loading,
    saving,
    error,
    message,
    profile,
    currentPlan,
    personalForm,
    fullProfileForm,
    passwordForm,
    notificationPrefs,
    updatePersonalField,
    updateFullProfileField,
    updatePasswordField,
    updateNotificationPref,
    savePersonalInfo,
    saveFullProfile,
    changePassword,
    deleteAccountLocal,
    refreshProfile,
  };
}
