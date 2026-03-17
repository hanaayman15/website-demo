import { useEffect, useMemo, useReducer, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/api';
import { resolveAuthToken } from '../utils/authSession';
import { getStorage, safeGet, safeJsonGet, safeJsonSet } from '../utils/storageSafe';
import {
  WEEK_DAYS,
  buildInitialProgramsState,
  buildProgramsPayload,
  normalizeProgramsSource,
  programsReducer,
} from './useClientDetailReducer';

function parseClientId(rawValue) {
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeNotes(value) {
  const text = String(value || '').trim();
  if (!text || text === 'No notes added' || text === 'N/A') return '';
  return text;
}

export function useClientDetail() {
  const local = getStorage('local');
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [client, setClient] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [programsState, dispatch] = useReducer(programsReducer, undefined, buildInitialProgramsState);

  const selectedClientId = useMemo(() => {
    return parseClientId(searchParams.get('id')) || parseClientId(safeGet(local, 'currentClientId'));
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;

    async function loadClient() {
      setLoading(true);
      setError('');
      setMessage('');

      try {
        if (!selectedClientId) {
          throw new Error('No client selected.');
        }

        let resolvedClient = null;
        const token = resolveAuthToken();

        if (token) {
          try {
            const clientResponse = await apiClient.get(`/api/admin/clients/${selectedClientId}`);
            resolvedClient = clientResponse?.data || null;
          } catch {
            // Fallback to local cache.
          }
        }

        if (!resolvedClient) {
          const clients = safeJsonGet(local, 'clients', []);
          resolvedClient = clients.find((item) => Number(item?.id) === Number(selectedClientId)) || null;
        }

        if (!resolvedClient) {
          throw new Error('Client details not found.');
        }

        if (!mounted) return;

        setClient(resolvedClient);

        const programsKey = `clientPrograms_${selectedClientId}`;
        const savedPrograms = safeJsonGet(local, programsKey, null);
        const mealSwaps = resolvedClient.meal_swaps || null;
        const source = savedPrograms && savedPrograms.dayMeals ? savedPrograms : mealSwaps;

        dispatch({
          type: 'INIT_FROM_SOURCE',
          payload: normalizeProgramsSource(source, resolvedClient),
        });
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load client details.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadClient();
    return () => {
      mounted = false;
    };
  }, [selectedClientId]);

  const updateProgramField = (field, value) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { field, value } });
  };

  const updateNotes = (value) => {
    dispatch({ type: 'UPDATE_NOTES', payload: value });
  };

  const addMeal = () => {
    dispatch({ type: 'ADD_MEAL', payload: { dayName: selectedDay } });
  };

  const updateMeal = (mealId, field, value) => {
    dispatch({ type: 'UPDATE_MEAL', payload: { dayName: selectedDay, mealId, field, value } });
  };

  const moveMealUp = (mealId) => {
    dispatch({ type: 'MOVE_MEAL_UP', payload: { dayName: selectedDay, mealId } });
  };

  const moveMealDown = (mealId) => {
    dispatch({ type: 'MOVE_MEAL_DOWN', payload: { dayName: selectedDay, mealId } });
  };

  const deleteMeal = (mealId) => {
    dispatch({ type: 'REMOVE_MEAL', payload: { dayName: selectedDay, mealId } });
  };

  const saveNotes = async (event) => {
    event.preventDefault();
    if (!client || !selectedClientId) return;

    setSaving(true);
    setError('');
    setMessage('');

    const { notesText, mentalText, supplementsText, competitionStatus, mealSwapsPayload } =
      buildProgramsPayload(programsState);

    try {
      const updated = {
        ...client,
        notes: notesText || 'No notes added',
        additionalNotes: notesText || 'No notes added',
        mentalObservation: mentalText || 'No mental observations',
        supplements: supplementsText || 'No supplements added',
        meal_swaps: mealSwapsPayload,
      };
      setClient(updated);

      const clients = safeJsonGet(local, 'clients', []);
      const idx = clients.findIndex((item) => Number(item?.id) === Number(selectedClientId));
      if (idx >= 0) {
        clients[idx] = {
          ...clients[idx],
          notes: updated.notes,
          additionalNotes: updated.additionalNotes,
          mentalObservation: updated.mentalObservation,
          supplements: updated.supplements,
          meal_swaps: mealSwapsPayload,
        };
        safeJsonSet(local, 'clients', clients);
      }

      const programsKey = `clientPrograms_${selectedClientId}`;
      safeJsonSet(local, programsKey, mealSwapsPayload);

      if (resolveAuthToken()) {
        try {
          await apiClient.put(`/api/admin/clients/${selectedClientId}`, {
            additional_notes: updated.additionalNotes,
            mental_observation: updated.mentalObservation,
            supplements: updated.supplements,
            competition_enabled: Boolean(programsState.programFields.competitionEnabled),
            competition_status: competitionStatus || null,
            meal_swaps: mealSwapsPayload,
          });
        } catch {
          // Keep local success as baseline even when backend save is unavailable.
        }
      }

      setMessage('Notes saved successfully.');
    } catch (err) {
      setError(err?.message || 'Failed to save notes.');
    } finally {
      setSaving(false);
    }
  };

  return {
    selectedClientId,
    loading,
    saving,
    error,
    message,
    client,
    weekDays: WEEK_DAYS,
    selectedDay,
    setSelectedDay,
    programsState,
    updateNotes,
    updateProgramField,
    addMeal,
    updateMeal,
    moveMealUp,
    moveMealDown,
    deleteMeal,
    saveNotes,
  };
}
