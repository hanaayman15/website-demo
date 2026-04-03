import { useEffect, useMemo, useReducer } from 'react';
import { useSearchParams } from 'react-router-dom';
import { resolveAuthRole, resolveAuthToken } from '../utils/authSession';

export function normalizePdfClient(item) {
  const asInt = (value) => {
    const n = Number(value);
    return Number.isInteger(n) ? n : null;
  };

  return {
    id: asInt(item?.id),
    displayId: item?.displayId == null ? null : String(item.displayId),
    name: item?.name == null ? null : String(item.name),
    age: asInt(item?.age),
    gender: item?.gender == null ? null : String(item.gender),
    phone: item?.phone == null ? null : String(item.phone),
    source: item?.source == null ? null : String(item.source),
    teamName: item?.teamName == null ? null : String(item.teamName),
  };
}

export function buildPdfRequestPayload({ language, clients }) {
  return {
    language: language === 'arabic' ? 'arabic' : 'english',
    clients: (Array.isArray(clients) ? clients : []).map(normalizePdfClient),
  };
}

function getAuthHeader() {
  const token = resolveAuthToken();
  if (!token) return null;
  return `Bearer ${token}`;
}

function getApiBaseUrl() {
  return String(import.meta.env.VITE_API_BASE_URL || '').trim();
}

function fallbackFilename(language) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const langCode = language === 'arabic' ? 'ar' : 'en';
  return `clients-report-${langCode}-${y}${m}${d}.pdf`;
}

function extractFilename(contentDisposition, language) {
  if (!contentDisposition) return fallbackFilename(language);
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match && utf8Match[1]) return decodeURIComponent(utf8Match[1].trim());
  const basicMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return basicMatch?.[1]?.trim() || fallbackFilename(language);
}

function formatApiError(detail, fallback) {
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const lines = detail
      .map((entry) => {
        if (!entry) return '';
        const path = Array.isArray(entry.loc) ? entry.loc.join('.') : '';
        const msg = entry.msg || JSON.stringify(entry);
        return path ? `${path}: ${msg}` : msg;
      })
      .filter(Boolean);
    return lines.length ? lines.join(' | ') : fallback;
  }
  if (typeof detail === 'object') return detail.msg || fallback;
  return fallback;
}

export function buildPdfGeneratorInitialState() {
  return {
    role: String(resolveAuthRole() || '').toLowerCase(),
    loading: true,
    generating: false,
    error: '',
    message: '',
    teams: [],
    clients: [],
    language: 'english',
    teamId: '',
    clientId: '',
  };
}

export function pdfGeneratorReducer(state, action) {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: '', message: '' };
    case 'LOAD_SUCCESS':
      return { ...state, loading: false, teams: action.payload.teams, clients: action.payload.clients };
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_TEAM':
      return { ...state, teamId: action.payload, clientId: action.payload ? '' : state.clientId };
    case 'SET_CLIENT':
      return { ...state, clientId: action.payload, teamId: action.payload ? '' : state.teamId };
    case 'GENERATE_START':
      return { ...state, generating: true, error: '', message: '' };
    case 'GENERATE_DONE':
      return { ...state, generating: false, message: action.payload };
    case 'SET_ERROR':
      return { ...state, generating: false, error: action.payload, message: '' };
    default:
      return state;
  }
}

export function usePdfGenerator() {
  const [searchParams] = useSearchParams();
  const [state, dispatch] = useReducer(pdfGeneratorReducer, undefined, buildPdfGeneratorInitialState);
  const preselectedClientId = searchParams.get('client_id') || '';
  const preselectedTeamId = searchParams.get('team_id') || '';
  const canUsePdfGenerator = state.role === 'admin' || state.role === 'doctor';

  useEffect(() => {
    if (preselectedClientId) {
      dispatch({ type: 'SET_CLIENT', payload: preselectedClientId });
      return;
    }
    if (preselectedTeamId) {
      dispatch({ type: 'SET_TEAM', payload: preselectedTeamId });
    }
  }, [preselectedClientId, preselectedTeamId]);

  useEffect(() => {
    const token = resolveAuthToken();
    if (!canUsePdfGenerator || !token) {
      dispatch({ type: 'LOAD_SUCCESS', payload: { teams: [], clients: [] } });
      if (canUsePdfGenerator && !token) {
        dispatch({ type: 'LOAD_ERROR', payload: 'Missing active doctor/admin session token. Please login again.' });
      }
      return;
    }

    let mounted = true;

    const load = async () => {
      dispatch({ type: 'LOAD_START' });
      const baseUrl = getApiBaseUrl();
      try {
        const authHeader = getAuthHeader();
        const response = await fetch(`${baseUrl}/api/pdf-options`, {
          method: 'GET',
          credentials: 'omit',
          cache: 'no-cache',
          headers: authHeader ? { Authorization: authHeader } : {},
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(formatApiError(data.detail, 'Failed to load PDF options.'));
        }

        if (!mounted) return;
        dispatch({
          type: 'LOAD_SUCCESS',
          payload: {
            teams: Array.isArray(data.teams) ? data.teams : [],
            clients: Array.isArray(data.clients) ? data.clients : [],
          },
        });
      } catch (error) {
        if (!mounted) return;
        dispatch({ type: 'LOAD_ERROR', payload: error.message || 'Failed to load PDF options.' });
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [canUsePdfGenerator]);

  const selectionSummary = useMemo(() => {
    if (state.teamId) {
      const team = state.teams.find((item) => String(item.id) === String(state.teamId));
      return team ? `Selected Team: ${team.team_name} (${team.players_count || 0} players)` : 'Selected Team';
    }
    if (state.clientId) {
      const client = state.clients.find((item) => String(item.id) === String(state.clientId));
      return client
        ? `Selected Client: ${client.full_name || '-'} (ID: ${client.display_id || client.id})`
        : 'Selected Client';
    }
    return 'No selection yet';
  }, [state.clientId, state.clients, state.teamId, state.teams]);

  const canGenerate = useMemo(() => {
    return canUsePdfGenerator && Boolean(state.teamId || state.clientId) && !state.generating;
  }, [canUsePdfGenerator, state.generating, state.teamId, state.clientId]);

  const setLanguage = (language) => dispatch({ type: 'SET_LANGUAGE', payload: language });
  const setTeam = (teamId) => dispatch({ type: 'SET_TEAM', payload: teamId });
  const setClient = (clientId) => dispatch({ type: 'SET_CLIENT', payload: clientId });

  const generatePdf = async () => {
    if (!canUsePdfGenerator) {
      dispatch({ type: 'SET_ERROR', payload: 'Only admin or doctor users can generate PDFs on this page.' });
      return;
    }

    const ok = await generateServerPdf();
    if (!ok) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to generate PDF for the selected team/client.' });
    }
  };

  const generateServerPdf = async () => {
    if (!state.clientId && !state.teamId) return false;

    const selectedClients = [];
    if (state.clientId) {
      const selectedClient = state.clients.find((item) => String(item.id) === String(state.clientId));
      if (!selectedClient) {
        dispatch({ type: 'SET_ERROR', payload: 'Selected client is not available.' });
        return false;
      }
      selectedClients.push({
        id: selectedClient.id,
        displayId: selectedClient.display_id || selectedClient.id,
        name: selectedClient.full_name || 'Unknown',
        age: selectedClient.age,
        gender: selectedClient.gender || 'N/A',
        phone: selectedClient.phone || 'N/A',
        source: String(selectedClient.created_source || '').toLowerCase() === 'profile_setup' ? 'Profile Setup' : 'Add Client',
        teamName: selectedClient.team_name || null,
      });
    }

    if (state.teamId) {
      const selectedTeam = state.teams.find((item) => String(item.id) === String(state.teamId));
      const teamPlayers = Array.isArray(selectedTeam?.players) ? selectedTeam.players : [];
      if (!selectedTeam || !teamPlayers.length) {
        dispatch({ type: 'SET_ERROR', payload: 'Selected team has no players available for PDF export.' });
        return false;
      }

      for (const player of teamPlayers) {
        selectedClients.push({
          id: player.id,
          displayId: player.display_id || player.id,
          name: player.full_name || 'Unknown',
          age: player.age,
          gender: player.gender || 'N/A',
          phone: player.phone || 'N/A',
          source: 'Team',
          teamName: player.team_name || selectedTeam.team_name || null,
        });
      }
    }

    if (!selectedClients.length) {
      dispatch({ type: 'SET_ERROR', payload: 'No valid team/client rows found for PDF export.' });
      return;
    }

    dispatch({ type: 'GENERATE_START' });
    const baseUrl = getApiBaseUrl();

    const payload = buildPdfRequestPayload({
      language: state.language,
      clients: selectedClients,
    });

    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        dispatch({ type: 'SET_ERROR', payload: 'Missing active doctor/admin session token. Please login again.' });
        return false;
      }
      const response = await fetch(`${baseUrl}/api/reports/clients-pdf`, {
        method: 'POST',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(formatApiError(errData.detail, 'Failed to generate PDF on server.'));
      }

      const blob = await response.blob();
      const filename = extractFilename(response.headers.get('Content-Disposition'), state.language);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      dispatch({ type: 'GENERATE_DONE', payload: 'PDF generated successfully.' });
      return true;
    } catch (error) {
      const fallback = 'Failed to generate PDF.';
      const message =
        (typeof error?.message === 'string' && error.message.trim()) ||
        (typeof error === 'string' && error.trim()) ||
        fallback;
      dispatch({ type: 'SET_ERROR', payload: message });
      return false;
    }
  };

  return {
    state,
    selectionSummary,
    canGenerate,
    setLanguage,
    setTeam,
    setClient,
    generatePdf,
    generateServerPdf,
  };
}
