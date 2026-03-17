import { useEffect, useMemo, useReducer } from 'react';

function decodeRoleFromToken(token) {
  try {
    const payload = JSON.parse(atob(String(token || '').split('.')[1] || ''));
    return String(payload?.role || '').toLowerCase();
  } catch {
    return '';
  }
}

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

export function getCurrentRole() {
  const fromStorage = String(
    safeStorageGet(typeof sessionStorage !== 'undefined' ? sessionStorage : null, 'role') ||
    safeStorageGet(typeof sessionStorage !== 'undefined' ? sessionStorage : null, 'authRole') ||
    safeStorageGet(typeof localStorage !== 'undefined' ? localStorage : null, 'authRole') ||
    ''
  ).toLowerCase();
  if (fromStorage) return fromStorage;
  const token =
    safeStorageGet(typeof localStorage !== 'undefined' ? localStorage : null, 'token') ||
    safeStorageGet(typeof localStorage !== 'undefined' ? localStorage : null, 'authToken');
  return decodeRoleFromToken(token);
}

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
  const token =
    safeStorageGet(typeof localStorage !== 'undefined' ? localStorage : null, 'token') ||
    safeStorageGet(typeof localStorage !== 'undefined' ? localStorage : null, 'authToken');
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
    role: getCurrentRole(),
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
  const [state, dispatch] = useReducer(pdfGeneratorReducer, undefined, buildPdfGeneratorInitialState);

  useEffect(() => {
    if (state.role !== 'admin') {
      dispatch({ type: 'LOAD_SUCCESS', payload: { teams: [], clients: [] } });
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
          credentials: 'include',
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
  }, [state.role]);

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
    return state.role === 'admin' && Boolean(state.teamId || state.clientId) && !state.generating;
  }, [state.generating, state.role, state.teamId, state.clientId]);

  const setLanguage = (language) => dispatch({ type: 'SET_LANGUAGE', payload: language });
  const setTeam = (teamId) => dispatch({ type: 'SET_TEAM', payload: teamId });
  const setClient = (clientId) => dispatch({ type: 'SET_CLIENT', payload: clientId });

  const generatePdf = async () => {
    if (state.role !== 'admin') {
      dispatch({ type: 'SET_ERROR', payload: 'Only admin users can generate PDFs on this page.' });
      return;
    }

    if (state.clientId) {
      const langParam = state.language === 'arabic' ? 'ar' : 'en';
      window.location.href = `/client-detail?id=${encodeURIComponent(state.clientId)}&auto_pdf=1&pdf_lang=${encodeURIComponent(langParam)}`;
      return;
    }

    if (state.teamId) {
      dispatch({ type: 'SET_ERROR', payload: 'Select a single client for the same PDF format used by Client Details.' });
      return;
    }

    dispatch({ type: 'SET_ERROR', payload: 'Select a team or client first.' });
  };

  const generateServerPdf = async () => {
    if (!state.clientId) return false;

    dispatch({ type: 'GENERATE_START' });
    const baseUrl = getApiBaseUrl();

    const client = state.clients.find((item) => String(item.id) === String(state.clientId));
    if (!client) {
      dispatch({ type: 'SET_ERROR', payload: 'Selected client is not available.' });
      return false;
    }

    const payload = buildPdfRequestPayload({
      language: state.language,
      clients: [
        {
          id: client.id,
          displayId: client.display_id || client.id,
          name: client.full_name || 'Unknown',
          age: client.age,
          gender: client.gender || 'N/A',
          phone: client.phone || 'N/A',
          source: String(client.created_source || '').toLowerCase() === 'profile_setup' ? 'Profile Setup' : 'Add Client',
        },
      ],
    });

    try {
      const authHeader = getAuthHeader();
      const response = await fetch(`${baseUrl}/api/reports/clients-pdf`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
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
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to generate PDF.' });
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
