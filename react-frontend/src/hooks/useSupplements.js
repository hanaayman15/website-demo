import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/api';

const BASE_SUPPLEMENTS = [
  { key: 'whey', name: 'Whey Protein Isolate', tag: 'Essential', dosage: '25-30g per serving' },
  { key: 'creatine', name: 'Creatine Monohydrate', tag: 'Performance', dosage: '5g daily' },
  { key: 'omega', name: 'Omega-3 Fish Oil (EPA/DHA)', tag: 'Health', dosage: '2-3g EPA+DHA daily' },
  { key: 'vitamin-d', name: 'Vitamin D3', tag: 'Essential', dosage: '2000-4000 IU daily' },
  { key: 'magnesium', name: 'Magnesium Glycinate', tag: 'Recovery', dosage: '300-400mg daily' },
];

export function buildSupplementLogPayload({ clientId, supplementName }) {
  return {
    supplement_name: String(supplementName || '').trim(),
    dosage: 'As recommended on plan',
    time_taken: 'As directed',
    notes: 'Logged from supplements page',
    client_id: clientId,
  };
}

function parseApiError(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  return fallback;
}

function readCustomSupplements(clientId) {
  if (!clientId) return [];
  try {
    const raw = JSON.parse(localStorage.getItem('clientSupplements') || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter((row) => Number(row?.clientId) === Number(clientId));
  } catch {
    return [];
  }
}

export function useSupplements() {
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [clientId, setClientId] = useState(null);
  const [checkedMap, setCheckedMap] = useState({});
  const [customSupplements, setCustomSupplements] = useState([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const profileResponse = await apiClient.get('/api/client/profile');
      const profile = profileResponse?.data || {};
      const resolvedClientId = profile.id || null;
      setClientId(resolvedClientId);
      if (resolvedClientId) {
        localStorage.setItem('currentClientId', String(resolvedClientId));
      }

      setCustomSupplements(readCustomSupplements(resolvedClientId));

      const logsResponse = await apiClient.get('/api/client/supplements', {
        params: { days: 60, skip: 0, limit: 100 },
      });
      const logs = Array.isArray(logsResponse?.data) ? logsResponse.data : [];
      const takenSet = new Set(logs.map((row) => String(row?.supplement_name || '').toLowerCase()));

      const nextChecked = Object.fromEntries(
        BASE_SUPPLEMENTS.map((supplement) => [supplement.name, takenSet.has(supplement.name.toLowerCase())])
      );
      setCheckedMap(nextChecked);
    } catch (err) {
      setError(parseApiError(err, 'Could not load supplements data.'));
      setClientId(null);
      setCheckedMap({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleSupplement = async (supplementName, checked) => {
    setCheckedMap((prev) => ({ ...prev, [supplementName]: checked }));
    setError('');
    setMessage('');

    if (!checked) return;
    if (!clientId) {
      setError('Client not loaded. Please refresh this page.');
      setCheckedMap((prev) => ({ ...prev, [supplementName]: false }));
      return;
    }

    setSavingName(supplementName);
    try {
      const payload = buildSupplementLogPayload({ clientId, supplementName });
      await apiClient.post('/api/client/supplements', payload);
      setMessage(`${supplementName} logged successfully.`);
    } catch (err) {
      setError(parseApiError(err, 'Failed to log supplement to backend.'));
      setCheckedMap((prev) => ({ ...prev, [supplementName]: false }));
    } finally {
      setSavingName('');
    }
  };

  const takingCount = useMemo(
    () => Object.values(checkedMap).filter(Boolean).length,
    [checkedMap]
  );

  return {
    loading,
    savingName,
    error,
    message,
    baseSupplements: BASE_SUPPLEMENTS,
    checkedMap,
    takingCount,
    customSupplements,
    toggleSupplement,
    refresh,
  };
}
