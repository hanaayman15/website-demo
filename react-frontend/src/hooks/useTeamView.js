import { useEffect, useMemo, useReducer } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/api';

function safeStorageGet(storage, key, fallback = '') {
  try {
    if (storage && typeof storage.getItem === 'function') {
      return storage.getItem(key) || fallback;
    }
  } catch {
    // Ignore storage access errors in restricted runtimes.
  }
  return fallback;
}

function getCurrentRole() {
  const fromStorage = String(
    safeStorageGet(typeof sessionStorage !== 'undefined' ? sessionStorage : null, 'role') ||
    safeStorageGet(typeof localStorage !== 'undefined' ? localStorage : null, 'authRole') ||
    safeStorageGet(typeof sessionStorage !== 'undefined' ? sessionStorage : null, 'authRole') ||
    ''
  ).toLowerCase();
  if (fromStorage) return fromStorage;

  const token =
    safeStorageGet(typeof localStorage !== 'undefined' ? localStorage : null, 'token') ||
    safeStorageGet(typeof localStorage !== 'undefined' ? localStorage : null, 'authToken');
  if (!token) return '';
  try {
    const payload = JSON.parse(atob(String(token).split('.')[1] || ''));
    return String(payload?.role || '').toLowerCase();
  } catch {
    return '';
  }
}

export function buildTeamViewRow(player, teamId, canOpenPlayerDetails) {
  return {
    number: player?.player_number || '-',
    clientId: player?.client_id || '-',
    fullName: player?.full_name || '-',
    email: player?.email || '-',
    phone: player?.phone || '-',
    gender: player?.gender || '-',
    heightWeight: `${player?.height || '-'} / ${player?.weight || '-'}`,
    detailHref: canOpenPlayerDetails
      ? `/client-detail?team_id=${encodeURIComponent(teamId)}&player_id=${encodeURIComponent(player?.id || player?.player_number)}&tab=programs`
      : '',
  };
}

export function buildTeamViewInitialState() {
  return {
    loading: true,
    error: '',
    role: getCurrentRole(),
    team: null,
    rows: [],
  };
}

export function teamViewReducer(state, action) {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: '' };
    case 'LOAD_SUCCESS':
      return {
        ...state,
        loading: false,
        error: '',
        team: action.payload.team,
        rows: action.payload.rows,
      };
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

function parseApiError(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  return fallback;
}

export function useTeamView() {
  const [searchParams] = useSearchParams();
  const [state, dispatch] = useReducer(teamViewReducer, undefined, buildTeamViewInitialState);
  const teamId = searchParams.get('id') || '';

  useEffect(() => {
    if (!teamId) {
      dispatch({ type: 'LOAD_ERROR', payload: 'Missing team id.' });
      return;
    }

    let mounted = true;

    const load = async () => {
      dispatch({ type: 'LOAD_START' });
      try {
        const response = await apiClient.get(`/api/teams/${encodeURIComponent(teamId)}`);
        const team = response?.data || {};
        if (!mounted) return;

        const canOpenPlayerDetails = state.role === 'admin' || state.role === 'doctor';
        const rows = Array.isArray(team.players)
          ? team.players.map((player) => buildTeamViewRow(player, team.id, canOpenPlayerDetails))
          : [];

        dispatch({ type: 'LOAD_SUCCESS', payload: { team, rows } });
      } catch (error) {
        if (!mounted) return;
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          dispatch({ type: 'LOAD_ERROR', payload: 'Doctor or admin login required to view team details.' });
          return;
        }
        dispatch({ type: 'LOAD_ERROR', payload: parseApiError(error, 'Failed to load team details.') });
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [teamId, state.role]);

  const canOpenPlayerDetails = useMemo(() => state.role === 'admin' || state.role === 'doctor', [state.role]);

  return {
    state,
    teamId,
    canOpenPlayerDetails,
  };
}
