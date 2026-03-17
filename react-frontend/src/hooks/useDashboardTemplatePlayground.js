import { useMemo, useReducer } from 'react';

const DEFAULT_ROWS = [
  {
    id: 'team-eagles',
    label: 'Team Eagles',
    email: 'eagles@example.com',
    package: '25 Players',
    coach: 'Ahmed Samy',
    status: 'Active',
  },
  {
    id: 'client-omar',
    label: 'Client: Omar Hassan',
    email: 'omar.hassan@example.com',
    package: 'Cutting Plan',
    coach: 'Dr. Nour',
    status: 'Pending Review',
  },
];

export function buildInitialDashboardTemplateState() {
  return {
    searchTerm: '',
    stats: {
      activeTeams: 5,
      totalClients: 120,
      todayCheckins: 18,
      pendingDiets: 7,
      targetCalories: 2350,
      targetProtein: 165,
      targetCarbs: 240,
      targetFats: 70,
    },
    form: {
      fullName: '',
      sport: '',
      goal: 'maintain',
      checkinDate: '',
      notes: '',
    },
    rows: DEFAULT_ROWS,
  };
}

export function dashboardTemplateReducer(state, action) {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, searchTerm: action.payload };
    case 'UPDATE_FORM_FIELD':
      return {
        ...state,
        form: {
          ...state.form,
          [action.payload.field]: action.payload.value,
        },
      };
    case 'RESET_FORM':
      return {
        ...state,
        form: buildInitialDashboardTemplateState().form,
      };
    default:
      return state;
  }
}

export function filterDashboardRows(rows, searchTerm) {
  const normalized = String(searchTerm || '').trim().toLowerCase();
  if (!normalized) return Array.isArray(rows) ? rows : [];
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    return [row.label, row.email, row.package, row.coach, row.status]
      .some((value) => String(value || '').toLowerCase().includes(normalized));
  });
}

export function useDashboardTemplatePlayground() {
  const [state, dispatch] = useReducer(
    dashboardTemplateReducer,
    undefined,
    buildInitialDashboardTemplateState
  );

  const filteredRows = useMemo(
    () => filterDashboardRows(state.rows, state.searchTerm),
    [state.rows, state.searchTerm]
  );

  const setSearchTerm = (value) => {
    dispatch({ type: 'SET_SEARCH', payload: value });
  };

  const updateFormField = (field, value) => {
    dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field, value } });
  };

  const resetForm = () => {
    dispatch({ type: 'RESET_FORM' });
  };

  return {
    state,
    filteredRows,
    setSearchTerm,
    updateFormField,
    resetForm,
  };
}
