import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/api';
import { fullNameIsValid } from './useProfileSetup';
import { usePersistentDraft } from './usePersistentDraft';
import { getStorage, safeJsonGet, safeJsonSet } from '../utils/storageSafe';
import { WORLD_COUNTRIES, WORLD_PHONE_OPTIONS } from '../constants/globalOptions';

const PHONE_OPTIONS = WORLD_PHONE_OPTIONS;

const AUTOFILL_KEY = 'addClientBasicAutofillV1';
const LAST_CLIENT_CONTEXT_KEY = 'lastClientContextV1';

const INITIAL_FORM = {
  clientId: 'Auto',
  fullName: '',
  phoneCountryCode: '+20',
  phoneNumber: '',
  email: '',
  password: '',
  gender: '',
  birthday: '',
  country: 'Egypt',
  club: '',
  religion: '',
};

export function normalizeDisplayGender(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'N/A';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function calculateAgeFromBirthday(birthday) {
  if (!birthday) return 'N/A';
  const birthDate = new Date(birthday);
  if (Number.isNaN(birthDate.getTime())) return 'N/A';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return Number.isFinite(age) && age >= 0 && age <= 100 ? age : 'N/A';
}

function parseApiError(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (!item) return '';
        if (typeof item === 'string') return item;
        const location = Array.isArray(item.loc) ? item.loc.join('.') : '';
        const message = item.msg || item.message || '';
        return [location, message].filter(Boolean).join(': ');
      })
      .filter(Boolean);
    return messages.length ? messages.join(' | ') : fallback;
  }
  if (typeof detail === 'object') return detail.message || fallback;
  return fallback;
}

function isAccessDeniedError(error) {
  const status = Number(error?.response?.status || 0);
  if (status === 401 || status === 403) return true;
  const detail = String(error?.response?.data?.detail || '').toLowerCase();
  return detail.includes('only admin or doctor users can access this resource');
}

function splitPhoneE164(phoneValue) {
  const raw = String(phoneValue || '').trim();
  if (!raw) {
    return { phoneCountryCode: '+20', phoneNumber: '' };
  }

  const normalized = raw.startsWith('+') ? raw : `+${raw.replace(/\D/g, '')}`;
  const knownDials = [...new Set(PHONE_OPTIONS.map((option) => option.dial))].sort((a, b) => b.length - a.length);
  const matchedDial = knownDials.find((dial) => normalized.startsWith(dial));

  if (matchedDial) {
    return {
      phoneCountryCode: matchedDial,
      phoneNumber: normalized.slice(matchedDial.length).replace(/\D/g, ''),
    };
  }

  return {
    phoneCountryCode: '+20',
    phoneNumber: normalized.replace(/\D/g, ''),
  };
}

function getFallbackAutofill() {
  const now = Date.now();
  return {
    fullName: 'Auto Filled Client Profile Name',
    phoneCountryCode: '+20',
    phoneNumber: '1000000000',
    email: `autofill_${now}@example.com`,
    password: 'Client@123',
    gender: 'male',
    birthday: '2000-01-01',
    country: 'Egypt',
    club: 'Auto Club',
    religion: 'Other',
  };
}

function syncClientCachesAfterBasicSave(responseData, payload, editClientId) {
  const local = getStorage('local');
  const userId = String(editClientId || responseData.user_id || '');
  const displayId = String(responseData.display_id || responseData.client_id || '');
  const phone = `${payload.phone_country_code || ''}${payload.phone_number || ''}`.trim() || 'N/A';
  const age = calculateAgeFromBirthday(payload.birthday);

  const snapshot = {
    id: Number(userId) || responseData.user_id || null,
    displayId: Number(displayId) || responseData.display_id || null,
    name: payload.full_name || 'Unknown',
    full_name: payload.full_name || 'Unknown',
    email: payload.email || 'N/A',
    phone,
    birthday: payload.birthday || 'N/A',
    age,
    gender: normalizeDisplayGender(payload.gender),
    country: payload.country || 'N/A',
    club: payload.club || 'N/A',
    religion: payload.religion || 'N/A',
  };

  [userId, displayId]
    .filter(Boolean)
    .forEach((key) => {
      const storageKey = `clientData_${key}`;
      const dashboardStorageKey = `clientDashboardCache_${key}`;
      const fullProfileStorageKey = `clientFullProfile_${key}`;
      try {
        const existing = safeJsonGet(local, storageKey, {}) || {};
        safeJsonSet(local, storageKey, { ...existing, ...snapshot });
      } catch {
        safeJsonSet(local, storageKey, snapshot);
      }

      try {
        const existingDashboard = safeJsonGet(local, dashboardStorageKey, {}) || {};
        safeJsonSet(local, dashboardStorageKey, { ...existingDashboard, ...snapshot });
      } catch {
        safeJsonSet(local, dashboardStorageKey, snapshot);
      }

      try {
        const existingFullProfile = safeJsonGet(local, fullProfileStorageKey, {}) || {};
        safeJsonSet(local, fullProfileStorageKey, { ...existingFullProfile, ...snapshot });
      } catch {
        safeJsonSet(local, fullProfileStorageKey, snapshot);
      }
    });

  try {
    const clients = safeJsonGet(local, 'clients', []);
    if (Array.isArray(clients)) {
      const updatedClients = clients.map((client) => {
        if (Number(client?.id) !== Number(userId) && Number(client?.display_id) !== Number(displayId)) {
          return client;
        }
        return {
          ...client,
          id: Number(userId) || client.id,
          display_id: Number(displayId) || client.display_id,
          full_name: payload.full_name || client.full_name,
          email: payload.email || client.email,
          phone,
          age,
          gender: payload.gender || client.gender,
          country: payload.country || client.country,
          club: payload.club || client.club,
          religion: payload.religion || client.religion,
          birthday: payload.birthday || client.birthday,
        };
      });
      safeJsonSet(local, 'clients', updatedClients);
    }
  } catch {
    // Keep save flow non-blocking for malformed local cache.
  }
}

export function useNewClient() {
  const local = getStorage('local');
  const [searchParams] = useSearchParams();
  const saveInFlightRef = useRef(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [redirectClientId, setRedirectClientId] = useState(null);

  const editClientId = useMemo(() => searchParams.get('client_id') || null, [searchParams]);
  const flow = useMemo(() => String(searchParams.get('flow') || '').toLowerCase(), [searchParams]);
  const isEditMode = Boolean(editClientId);
  const {
    draft,
    setDraft,
    clearDraft,
    hasDraft,
  } = usePersistentDraft({ key: AUTOFILL_KEY, initialValue: null, enabled: !isEditMode });

  const canSubmit = useMemo(() => {
    const hasPassword = isEditMode ? true : Boolean(form.password);
    return (
      fullNameIsValid(form.fullName) &&
      String(form.phoneNumber || '').replace(/\D/g, '').length >= 6 &&
      Boolean(form.email) &&
      hasPassword &&
      Boolean(form.gender) &&
      Boolean(form.birthday) &&
      Boolean(form.country)
    );
  }, [form, isEditMode]);

  const mapClientProfileToForm = (data) => {
    const hasSplitPhone = Boolean(data?.phone_country_code) || Boolean(data?.phone_number);
    const parsedPhone = hasSplitPhone
      ? {
        phoneCountryCode: data?.phone_country_code || '+20',
        phoneNumber: data?.phone_number || '',
      }
      : splitPhoneE164(data?.phone);

    return {
      clientId: String(data?.display_id || data?.client_id || data?.user_id || 'Auto'),
      fullName: data?.full_name || '',
      phoneCountryCode: parsedPhone.phoneCountryCode,
      phoneNumber: parsedPhone.phoneNumber,
      email: data?.email || '',
      password: '',
      gender: String(data?.gender || '').toLowerCase(),
      birthday: data?.birthday || '',
      country: data?.country || 'Egypt',
      club: data?.club || '',
      religion: data?.religion || '',
    };
  };

  const loadCurrentClientProfile = async () => {
    const response = await apiClient.get('/api/client/profile');
    return response?.data || {};
  };

  const saveCurrentClientProfile = async (payload) => {
    const response = await apiClient.put('/api/client/profile', {
      full_name: payload.full_name,
      email: payload.email,
      phone: `${payload.phone_country_code || ''}${payload.phone_number || ''}`,
      gender: payload.gender,
      birthday: payload.birthday,
      country: payload.country,
      club: payload.club,
      religion: payload.religion,
    });
    return response?.data || {};
  };

  const persistAutofillDraft = (nextForm) => {
    const draft = {
      full_name: nextForm.fullName.trim(),
      phone_country_code: nextForm.phoneCountryCode || '+20',
      phone_number: nextForm.phoneNumber.replace(/\D/g, ''),
      email: nextForm.email.trim().toLowerCase(),
      gender: nextForm.gender,
      birthday: nextForm.birthday,
      country: nextForm.country,
      club: nextForm.club.trim(),
      religion: nextForm.religion,
    };
    setDraft(draft);
  };

  const updateField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      persistAutofillDraft(next);
      return next;
    });
  };

  const runAutofill = () => {
    if (isEditMode) return;
    const localDraft = draft;
    const fallback = getFallbackAutofill();
    const next = {
      ...form,
      fullName: localDraft?.full_name || fallback.fullName,
      phoneCountryCode: localDraft?.phone_country_code || fallback.phoneCountryCode,
      phoneNumber: localDraft?.phone_number || fallback.phoneNumber,
      email: localDraft?.email || fallback.email,
      password: form.password || fallback.password,
      gender: localDraft?.gender || fallback.gender,
      birthday: localDraft?.birthday || fallback.birthday,
      country: localDraft?.country || fallback.country,
      club: localDraft?.club || fallback.club,
      religion: localDraft?.religion || fallback.religion,
    };
    setForm(next);
    persistAutofillDraft(next);
    setError('');
    setMessage('Autofill completed for all missing basic fields.');
  };

  const restoreDraft = () => {
    if (isEditMode || !draft) return;
    const restored = {
      ...form,
      fullName: draft.full_name || '',
      phoneCountryCode: draft.phone_country_code || '+20',
      phoneNumber: draft.phone_number || '',
      email: draft.email || '',
      gender: draft.gender || '',
      birthday: draft.birthday || '',
      country: draft.country || 'Egypt',
      club: draft.club || '',
      religion: draft.religion || '',
    };
    setForm(restored);
    setMessage('Saved draft restored.');
  };

  const discardDraft = () => {
    clearDraft();
    setMessage('Saved draft discarded.');
  };

  useEffect(() => {
    if (!isEditMode || !editClientId) {
      return;
    }

    let mounted = true;
    async function loadClient() {
      setLoading(true);
      setError('');
      try {
        let data = {};
        if (flow === 'signup') {
          data = await loadCurrentClientProfile();
        } else {
          try {
            const response = await apiClient.get(`/api/admin/clients/${encodeURIComponent(editClientId)}/basic`);
            data = response?.data || {};
          } catch (adminLoadError) {
            if (!isAccessDeniedError(adminLoadError)) {
              throw adminLoadError;
            }
            data = await loadCurrentClientProfile();
          }
        }
        if (!mounted) return;

        setForm((prev) => ({ ...prev, ...mapClientProfileToForm(data) }));
      } catch (err) {
        if (!mounted) return;
        setError(parseApiError(err, 'Failed to load client basic info.'));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadClient();
    return () => {
      mounted = false;
    };
  }, [editClientId, flow, isEditMode]);

  const saveBasicInfo = async (event) => {
    event.preventDefault();
    if (saveInFlightRef.current) {
      return;
    }
    setError('');
    setMessage('');

    if (!fullNameIsValid(form.fullName)) {
      setError('Full Name must contain at least 4 names.');
      return;
    }

    const phoneNumber = String(form.phoneNumber || '').replace(/\D/g, '');
    if (!phoneNumber) {
      setError('Phone Number is required.');
      return;
    }

    saveInFlightRef.current = true;
    setSaving(true);

    const payload = {
      full_name: form.fullName.trim(),
      phone_country_code: form.phoneCountryCode || '+20',
      phone_number: phoneNumber,
      email: form.email.trim().toLowerCase(),
      gender: form.gender,
      birthday: form.birthday,
      country: form.country,
      club: form.club.trim() || null,
      religion: form.religion || null,
      source: 'add_client',
    };

    if (!isEditMode) {
      payload.password = form.password;
    }

    try {
      let data = {};
      if (isEditMode) {
        if (flow === 'signup') {
          data = await saveCurrentClientProfile(payload);
        } else {
          try {
            const response = await apiClient.put(`/api/admin/clients/${encodeURIComponent(editClientId)}/basic`, payload);
            data = response?.data || {};
          } catch (adminSaveError) {
            if (!isAccessDeniedError(adminSaveError)) {
              throw adminSaveError;
            }
            data = await saveCurrentClientProfile(payload);
          }
        }
      } else {
        const response = await apiClient.post('/api/client', payload);
        data = response?.data || {};
      }
      const targetClientId = editClientId || data.user_id || null;

      setForm((prev) => ({
        ...prev,
        clientId: String(data.display_id || data.client_id || data.user_id || 'Auto'),
      }));
      persistAutofillDraft(form);
      syncClientCachesAfterBasicSave(data, payload, editClientId);
      safeJsonSet(local, LAST_CLIENT_CONTEXT_KEY, {
        user_id: targetClientId,
        display_id: data.display_id || null,
        full_name: payload.full_name,
        email: payload.email,
        source: 'add_client',
      });
      if (targetClientId) {
        localStorage.setItem('currentClientId', String(targetClientId));
      }
      localStorage.setItem('onboardingSource', flow === 'signup' ? 'signup' : 'add-client');
      localStorage.setItem('onboardingClientId', String(targetClientId || ''));

      if (!isEditMode) {
        clearDraft();
      }

      setMessage(isEditMode ? 'Basic information updated successfully.' : 'Client basic information saved successfully. Redirecting to subscription...');
      setRedirectClientId(targetClientId);
    } catch (err) {
      const fallback = err?.response?.status === 409
        ? 'A client with this email or phone already exists. Open that client from Clients page instead of creating a duplicate.'
        : 'Failed to save client.';
      setError(parseApiError(err, fallback));
    } finally {
      saveInFlightRef.current = false;
      setSaving(false);
    }
  };

  return {
    isEditMode,
    flow,
    editClientId,
    form,
    loading,
    saving,
    error,
    message,
    canSubmit,
    countries: WORLD_COUNTRIES,
    phoneOptions: PHONE_OPTIONS,
    redirectClientId,
    hasDraft: !isEditMode && hasDraft,
    updateField,
    runAutofill,
    restoreDraft,
    discardDraft,
    saveBasicInfo,
  };
}
