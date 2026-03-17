import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { clearSessionAuth, hasDoctorAdminSession, resolveAuthRole, resolveAuthToken } from '../utils/authSession';

export function getFallbackConfig() {
  return {
    quick_actions_title: 'Quick Actions.',
    quick_actions_description: 'Manage teams and doctor-access pages.',
    navigation: [
      { label: 'Home', href: '/doctor-dashboard' },
      { label: 'Teams', href: '/clients' },
      { label: 'Add Team', href: '/add-team' },
      { label: 'Team View', href: '/team-view' },
    ],
    modules: [
      {
        label: 'Home',
        href: '/doctor-dashboard',
        description: 'Doctor dashboard overview and quick access.',
      },
      {
        label: 'Teams',
        href: '/clients',
        description: 'Open teams and roster actions from the shared management page.',
      },
      {
        label: 'Add Team',
        href: '/add-team',
        description: 'Create and manage team rosters.',
      },
      {
        label: 'Team View',
        href: '/team-view',
        description: 'Open a saved team from Teams to view full roster details.',
      },
    ],
  };
}

export function normalizeDoctorDashboardConfig(config) {
  const fallback = getFallbackConfig();
  const normalized = config && typeof config === 'object' ? { ...config } : fallback;

  normalized.navigation = Array.isArray(normalized.navigation)
    ? normalized.navigation.map((item) => {
        if (!item || typeof item !== 'object') return item;
        if (String(item.label || '').trim().toLowerCase() === 'clients') {
          return { ...item, label: 'Teams', href: '/clients' };
        }
        return item;
      })
    : fallback.navigation;

  normalized.modules = Array.isArray(normalized.modules)
    ? normalized.modules.map((module) => {
        if (!module || typeof module !== 'object') return module;
        if (String(module.label || '').trim().toLowerCase() === 'clients') {
          return {
            ...module,
            label: 'Teams',
            href: '/clients',
            description: 'Open teams and roster actions from the shared management page.',
          };
        }
        return module;
      })
    : fallback.modules;

  return normalized;
}

export function summarizeTeams(teams) {
  const list = Array.isArray(teams) ? teams : [];
  const totalTeams = list.length;
  const totalPlayers = list.reduce((sum, team) => sum + Number(team?.players_count || 0), 0);
  return { totalTeams, totalPlayers };
}

export function buildInitialDoctorDashboardState() {
  return {
    loading: true,
    error: '',
    config: getFallbackConfig(),
    teams: [],
  };
}

export function doctorDashboardReducer(state, action) {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: '' };
    case 'LOAD_SUCCESS':
      return {
        ...state,
        loading: false,
        error: '',
        config: normalizeDoctorDashboardConfig(action.payload.config),
        teams: Array.isArray(action.payload.teams) ? action.payload.teams : [],
      };
    case 'LOAD_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
}

function currentAuthRole() {
  return resolveAuthRole();
}

function parseApiError(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  return fallback;
}

export function useDoctorDashboard() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(
    doctorDashboardReducer,
    undefined,
    buildInitialDoctorDashboardState
  );

  const refresh = useCallback(async () => {
    const role = currentAuthRole();
    const token = resolveAuthToken();
    const canAccess = (role === 'doctor' || role === 'admin') && !!token && hasDoctorAdminSession();

    if (!canAccess) {
      navigate('/doctor-auth?next=%2Fdoctor-dashboard', { replace: true });
      return;
    }

    dispatch({ type: 'LOAD_START' });
    try {
      const [configResult, teamsResult] = await Promise.allSettled([
        apiClient.get('/api/public/dashboards/doctor'),
        apiClient.get('/api/teams', { params: { skip: 0, limit: 200 } }),
      ]);

      const configData = configResult.status === 'fulfilled' ? configResult.value?.data : getFallbackConfig();
      const teamsData =
        teamsResult.status === 'fulfilled' && Array.isArray(teamsResult.value?.data)
          ? teamsResult.value.data
          : [];

      dispatch({ type: 'LOAD_SUCCESS', payload: { config: configData, teams: teamsData } });
    } catch (error) {
      dispatch({ type: 'LOAD_ERROR', payload: parseApiError(error, 'Failed to load doctor dashboard data.') });
    }
  }, [navigate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const summary = useMemo(() => summarizeTeams(state.teams), [state.teams]);
  const role = currentAuthRole() || 'doctor';

  const logout = () => {
    clearSessionAuth();
    navigate('/doctor-auth', { replace: true });
  };

  return {
    ...state,
    role,
    summary,
    refresh,
    logout,
  };
}
