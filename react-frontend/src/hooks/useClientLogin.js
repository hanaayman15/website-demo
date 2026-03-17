import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { persistSessionAuth } from '../utils/authSession';
import { getStorage, safeGet, safeRemove, safeSet } from '../utils/storageSafe';

const REMEMBERED_EMAIL_KEY = 'rememberedEmail';
const LOCAL = getStorage('local');

function normalizeError(error) {
  if (error?.response?.data?.detail) {
    if (typeof error.response.data.detail === 'string') return error.response.data.detail;
    if (Array.isArray(error.response.data.detail)) {
      return error.response.data.detail.map((item) => item?.msg || String(item)).join(', ');
    }
  }
  return error?.message || 'Login failed. Please try again.';
}

export function useClientLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const remembered = safeGet(LOCAL, REMEMBERED_EMAIL_KEY);
    if (remembered) {
      setForm((prev) => ({ ...prev, email: remembered, rememberMe: true }));
    }
  }, []);

  const canSubmit = useMemo(() => {
    return form.email.trim().length > 0 && form.password.length > 0 && !loading;
  }, [form, loading]);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const email = form.email.trim().toLowerCase();
      const password = form.password;

      const loginResponse = await apiClient.post('/api/auth/login', { email, password });
      const token = loginResponse?.data?.access_token;
      if (!token) {
        throw new Error('Login response did not include an access token.');
      }

      persistSessionAuth({ token, email, role: 'client' });
      if (form.rememberMe) {
        safeSet(LOCAL, REMEMBERED_EMAIL_KEY, email);
      } else {
        safeRemove(LOCAL, REMEMBERED_EMAIL_KEY);
      }

      try {
        const profileResponse = await apiClient.get('/api/client/profile');
        const profile = profileResponse?.data || {};
        const fullName = profile.full_name || email.split('@')[0] || 'Client';
        safeSet(LOCAL, 'clientFullName', fullName);
      } catch {
        safeSet(LOCAL, 'clientFullName', email.split('@')[0] || 'Client');
      }

      setSuccess('Login successful. Redirecting...');
      window.setTimeout(() => navigate('/dashboard'), 400);
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    error,
    success,
    canSubmit,
    updateField,
    submit,
  };
}
