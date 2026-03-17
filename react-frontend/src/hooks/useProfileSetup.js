import { useMemo, useState } from 'react';
import { apiClient } from '../services/api';

const AUTOFILL_KEY = 'profileSetupBasicAutofillV1';
const LAST_CLIENT_CONTEXT_KEY = 'lastClientContextV1';

export const WORLD_COUNTRIES = [
  'Egypt',
  'Saudi Arabia',
  'United Arab Emirates',
  'Jordan',
  'Qatar',
  'Kuwait',
  'Bahrain',
  'Oman',
  'Morocco',
  'Tunisia',
  'Algeria',
  'Libya',
  'Sudan',
  'United States',
  'United Kingdom',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Canada',
  'Australia',
  'Turkey',
  'India',
  'Pakistan',
];

export const PHONE_OPTIONS = [
  { country: 'Egypt', dial: '+20', display: 'Egypt +20' },
  { country: 'Saudi Arabia', dial: '+966', display: 'Saudi Arabia +966' },
  { country: 'United Arab Emirates', dial: '+971', display: 'UAE +971' },
  { country: 'Jordan', dial: '+962', display: 'Jordan +962' },
  { country: 'Qatar', dial: '+974', display: 'Qatar +974' },
  { country: 'Kuwait', dial: '+965', display: 'Kuwait +965' },
];

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

export function fullNameIsValid(value) {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
  return parts.length >= 4;
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

function readDraft() {
  try {
    const raw = localStorage.getItem(AUTOFILL_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function useProfileSetup() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [redirectClientId, setRedirectClientId] = useState(null);

  const canSubmit = useMemo(() => {
    return (
      fullNameIsValid(form.fullName) &&
      String(form.phoneNumber || '').replace(/\D/g, '').length >= 6 &&
      Boolean(form.email) &&
      Boolean(form.password) &&
      Boolean(form.gender) &&
      Boolean(form.birthday) &&
      Boolean(form.country)
    );
  }, [form]);

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
    localStorage.setItem(AUTOFILL_KEY, JSON.stringify(draft));
  };

  const updateField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      persistAutofillDraft(next);
      return next;
    });
  };

  const runAutofill = () => {
    const draft = readDraft();
    const fallback = getFallbackAutofill();
    const next = {
      ...form,
      fullName: draft?.full_name || fallback.fullName,
      phoneCountryCode: draft?.phone_country_code || fallback.phoneCountryCode,
      phoneNumber: draft?.phone_number || fallback.phoneNumber,
      email: draft?.email || fallback.email,
      password: form.password || fallback.password,
      gender: draft?.gender || fallback.gender,
      birthday: draft?.birthday || fallback.birthday,
      country: draft?.country || fallback.country,
      club: draft?.club || fallback.club,
      religion: draft?.religion || fallback.religion,
    };
    setForm(next);
    persistAutofillDraft(next);
    setError('');
    setMessage('Autofill completed for all missing basic fields.');
  };

  const saveBasicInfo = async (event) => {
    event.preventDefault();
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

    setSaving(true);

    const payload = {
      full_name: form.fullName.trim(),
      phone_country_code: form.phoneCountryCode || '+20',
      phone_number: phoneNumber,
      email: form.email.trim().toLowerCase(),
      password: form.password,
      gender: form.gender,
      birthday: form.birthday,
      country: form.country,
      club: form.club.trim() || null,
      religion: form.religion || null,
      source: 'profile_setup',
    };

    try {
      const response = await apiClient.post('/api/client', payload);
      const data = response?.data || {};
      const nextClientId = data.user_id || null;

      setForm((prev) => ({ ...prev, clientId: String(data.display_id || 'Auto') }));
      persistAutofillDraft({ ...form, clientId: String(data.display_id || 'Auto') });
      localStorage.setItem(
        LAST_CLIENT_CONTEXT_KEY,
        JSON.stringify({
          user_id: nextClientId,
          display_id: data.display_id || null,
          full_name: payload.full_name,
          email: payload.email,
          source: 'profile_setup',
        })
      );
      setMessage('Basic profile saved successfully. Redirecting to services...');
      setRedirectClientId(nextClientId);
    } catch (err) {
      setError(parseApiError(err, 'Failed to save profile.'));
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    saving,
    error,
    message,
    canSubmit,
    countries: WORLD_COUNTRIES,
    phoneOptions: PHONE_OPTIONS,
    redirectClientId,
    updateField,
    runAutofill,
    saveBasicInfo,
  };
}
