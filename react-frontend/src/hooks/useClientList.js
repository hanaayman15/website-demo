import { useCallback, useMemo, useState } from 'react';
import { apiClient } from '../services/api';
import { resolveAuthRole, resolveAuthToken } from '../utils/authSession';

export function getCurrentRole() {
  const token = resolveAuthToken();
  if (!token) return '';
  return String(resolveAuthRole() || '').toLowerCase();
}

export function sourceLabel(source) {
  const normalized = String(source || '').toLowerCase();
  return normalized === 'profile_setup' ? 'Profile Setup' : 'Add Client';
}

export function splitClientsBySource(clients) {
  const allClients = Array.isArray(clients) ? clients : [];
  const addClientData = allClients.filter((c) => String(c.created_source || '').toLowerCase() !== 'profile_setup');
  const profileSetupData = allClients.filter((c) => String(c.created_source || '').toLowerCase() === 'profile_setup');
  return { addClientData, profileSetupData };
}

function buildSearchMatcher(term) {
  const normalizedTerm = String(term || '').trim().toLowerCase();
  if (!normalizedTerm) return null;
  return (value) => String(value || '').toLowerCase().includes(normalizedTerm);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function explainHttpError(err, fallback) {
  const status = Number(err?.response?.status || 0);
  const detail = err?.response?.data?.detail;
  if (status === 502) {
    return 'Backend unavailable (502 Bad Gateway). Start/restart backend API server and verify Vite proxy target is reachable.';
  }
  if (status === 401) {
    return 'Unauthorized (401). Doctor/Admin login is required and session token must be active.';
  }
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }
  return fallback;
}

export function useClientList() {
  const [teamsData, setTeamsData] = useState([]);
  const [clientsData, setClientsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [error, setError] = useState('');

  const role = getCurrentRole();
  const hasToken = Boolean(resolveAuthToken());
  const isAdmin = role === 'admin';

  const { addClientData, profileSetupData } = useMemo(() => splitClientsBySource(clientsData), [clientsData]);

  const filteredTeams = useMemo(() => {
    const matches = buildSearchMatcher(searchTerm);
    if (!matches) return teamsData;
    return teamsData.filter((team) => {
      return (
        matches(team.team_name) ||
        matches(team.coach_name) ||
        matches(team.package_size) ||
        matches(team.players_count)
      );
    });
  }, [searchTerm, teamsData]);

  const filteredAddClientData = useMemo(() => {
    if (!isAdmin) return [];
    const matches = buildSearchMatcher(searchTerm);
    if (!matches) return addClientData;
    return addClientData.filter((client) => {
      return (
        matches(client.full_name) ||
        matches(client.email) ||
        matches(client.phone) ||
        matches(client.gender) ||
        matches(client.sport) ||
        matches(sourceLabel(client.created_source)) ||
        matches(client.display_id || client.id)
      );
    });
  }, [addClientData, isAdmin, searchTerm]);

  const filteredProfileSetupData = useMemo(() => {
    if (!isAdmin) return [];
    const matches = buildSearchMatcher(searchTerm);
    if (!matches) return profileSetupData;
    return profileSetupData.filter((client) => {
      return (
        matches(client.full_name) ||
        matches(client.email) ||
        matches(client.phone) ||
        matches(client.gender) ||
        matches(client.sport) ||
        matches(sourceLabel(client.created_source)) ||
        matches(client.display_id || client.id)
      );
    });
  }, [isAdmin, profileSetupData, searchTerm]);

  const refreshTeams = useCallback(async () => {
    if (!hasToken) {
      setTeamsData([]);
      setLoadingTeams(false);
      return;
    }
    setLoadingTeams(true);
    setError('');
    try {
      const response = await apiClient.get('/api/teams', {
        params: { skip: 0, limit: 200 },
      });
      setTeamsData(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setError(explainHttpError(err, 'Failed to load teams.'));
      setTeamsData([]);
    } finally {
      setLoadingTeams(false);
    }
  }, [hasToken]);

  const refreshClients = useCallback(async () => {
    if (!hasToken || !isAdmin) {
      setClientsData([]);
      return;
    }

    setLoadingClients(true);
    try {
      const response = await apiClient.get('/api/auth/clients-public', {
        params: { skip: 0, limit: 1000 },
      });
      setClientsData(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setClientsData([]);
      setError(explainHttpError(err, 'Failed to load clients list.'));
    } finally {
      setLoadingClients(false);
    }
  }, [hasToken, isAdmin]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshTeams(), refreshClients()]);
  }, [refreshClients, refreshTeams]);

  const deleteClient = useCallback(async (clientId) => {
    if (!isAdmin) {
      throw new Error('Admin only action.');
    }
    await apiClient.delete(`/api/admin/clients/${encodeURIComponent(clientId)}`);
    await refreshClients();
  }, [isAdmin, refreshClients]);

  const deleteTeam = useCallback(async (teamId) => {
    if (!isAdmin) {
      throw new Error('Admin only action.');
    }
    await apiClient.delete(`/api/teams/${encodeURIComponent(teamId)}`);
    await refreshTeams();
  }, [isAdmin, refreshTeams]);

  const exportTeamCsv = useCallback(async (teamId) => {
    if (!isAdmin) {
      throw new Error('Admin only action.');
    }
    const response = await apiClient.get(`/api/reports/teams/${encodeURIComponent(teamId)}/csv`, {
      responseType: 'blob',
    });
    downloadBlob(response.data, `team_${teamId}.csv`);
  }, [isAdmin]);

  return {
    role,
    isAdmin,
    searchTerm,
    setSearchTerm,
    loadingTeams,
    loadingClients,
    error,
    filteredTeams,
    filteredAddClientData,
    filteredProfileSetupData,
    refreshAll,
    deleteClient,
    deleteTeam,
    exportTeamCsv,
  };
}
