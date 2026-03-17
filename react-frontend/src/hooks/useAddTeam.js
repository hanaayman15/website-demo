import { useEffect, useMemo, useReducer } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/api';

const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  'very-active': 1.725,
  'extremely-active': 1.9,
};

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function calculateAge(birthday) {
  if (!birthday) return null;
  const birth = new Date(birthday);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const md = now.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

export function createTeamPlayer(playerNumber) {
  return {
    player_number: playerNumber,
    full_name: '',
    phone_country_code: '+20',
    phone_number: '',
    email: '',
    password: '',
    gender: '',
    birthday: '',
    country: 'Egypt',
    club: '',
    religion: '',
    height: '',
    weight: '',
    bmi: '',
    body_fat_percentage: '',
    skeletal_muscle: '',
    body_fat_mass: '',
    muscle_percentage: '',
    age: '',
    bmr: '',
    activity_level: 'moderate',
    sport: '',
    position: '',
    tdee: '',
    progression_type: 'maintain',
    calories: '',
    protein_target: '',
    carbs_target: '',
    fats_target: '',
    water_in_body: '',
    water_intake: '',
    minerals: '',
    test_and_record: '',
    injuries: '',
    mental_notes: '',
    food_allergies: '',
    medical_notes: '',
    food_likes: '',
    food_dislikes: '',
    competition_date: '',
    days_left: '',
    goal_weight: '',
    additional_notes: '',
    training_sessions: [],
    supplements_list: [],
  };
}

export function recalcTeamPlayer(player) {
  const next = { ...player };
  const height = toNum(next.height);
  const weight = toNum(next.weight);
  const bodyFat = toNum(next.body_fat_percentage);
  const skeletal = toNum(next.skeletal_muscle);
  const age = toNum(next.age) || calculateAge(next.birthday);
  const gender = String(next.gender || '').toLowerCase();

  if (height && weight && height > 0) {
    next.bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);
  }
  if (weight && bodyFat !== null) {
    next.body_fat_mass = ((weight * bodyFat) / 100).toFixed(1);
  }
  if (weight && skeletal !== null && weight > 0) {
    next.muscle_percentage = ((skeletal / weight) * 100).toFixed(1);
  }

  if (height && weight && age && gender) {
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr += gender === 'female' ? -161 : 5;
    next.bmr = bmr.toFixed(1);
  }

  const bmrVal = toNum(next.bmr);
  const factor = ACTIVITY_FACTORS[next.activity_level] || ACTIVITY_FACTORS.sedentary;
  if (bmrVal) {
    const tdee = bmrVal * factor;
    next.tdee = tdee.toFixed(1);

    let calories = tdee;
    if (next.progression_type === 'cut') calories = tdee * 0.8;
    if (next.progression_type === 'bulk') calories = tdee * 1.15;
    next.calories = calories.toFixed(1);

    if (weight) {
      const protein = weight * 2;
      const fats = weight * 0.8;
      const carbs = Math.max((calories - (protein * 4 + fats * 9)) / 4, 0);
      next.protein_target = protein.toFixed(1);
      next.fats_target = fats.toFixed(1);
      next.carbs_target = carbs.toFixed(1);
      next.water_intake = (weight * 0.035).toFixed(1);
    }
  }

  if (next.competition_date) {
    const now = new Date();
    const target = new Date(next.competition_date);
    const days = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    next.days_left = Number.isFinite(days) ? String(Math.max(days, 0)) : '';
  }

  return next;
}

export function buildTeamPayload(state) {
  return {
    team_name: state.teamName.trim(),
    sport_type: state.sportType.trim(),
    coach_name: state.coachName.trim(),
    start_date: state.startDate,
    package_size: state.packageSize,
    players: state.players.map((player, index) => ({
      ...player,
      player_number: index + 1,
      height: toNum(player.height),
      weight: toNum(player.weight),
      bmi: toNum(player.bmi),
      body_fat_percentage: toNum(player.body_fat_percentage),
      skeletal_muscle: toNum(player.skeletal_muscle),
      body_fat_mass: toNum(player.body_fat_mass),
      muscle_percentage: toNum(player.muscle_percentage),
      age: toNum(player.age),
      bmr: toNum(player.bmr),
      tdee: toNum(player.tdee),
      calories: toNum(player.calories),
      protein_target: toNum(player.protein_target),
      carbs_target: toNum(player.carbs_target),
      fats_target: toNum(player.fats_target),
      water_in_body: toNum(player.water_in_body),
      water_intake: toNum(player.water_intake),
      goal_weight: toNum(player.goal_weight),
      days_left: toNum(player.days_left),
      training_sessions: (player.training_sessions || []).map((item) => ({ session_info: JSON.stringify(item) })),
      supplements_list: (player.supplements_list || []).map((item) => ({ supplement_info: JSON.stringify(item) })),
    })),
  };
}

export function buildAddTeamInitialState() {
  return {
    loading: false,
    saving: false,
    error: '',
    success: '',
    editingTeamId: null,
    teamName: '',
    sportType: '',
    coachName: '',
    startDate: '',
    packageSize: 0,
    players: [],
  };
}

function createPlayers(size) {
  return Array.from({ length: size }, (_, i) => createTeamPlayer(i + 1));
}

function parseError(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  return fallback;
}

function validatePlayers(players) {
  for (const player of players) {
    const words = String(player.full_name || '').trim().split(/\s+/).filter(Boolean);
    if (words.length < 4) return `Player ${player.player_number}: full name must include at least 4 names.`;
    if (!player.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(player.email))) return `Player ${player.player_number}: valid email is required.`;
    if (!player.gender) return `Player ${player.player_number}: gender is required.`;
  }
  return '';
}

export function addTeamReducer(state, action) {
  switch (action.type) {
    case 'SET_EDIT_ID':
      return { ...state, editingTeamId: action.payload };
    case 'UPDATE_FIELD':
      return { ...state, [action.payload.field]: action.payload.value };
    case 'SET_PACKAGE_SIZE':
      return {
        ...state,
        packageSize: action.payload,
        players: createPlayers(action.payload),
      };
    case 'UPDATE_PLAYER': {
      const { index, field, value } = action.payload;
      return {
        ...state,
        players: state.players.map((item, idx) => {
          if (idx !== index) return item;
          return recalcTeamPlayer({ ...item, [field]: value });
        }),
      };
    }
    case 'AUTOFILL_PLAYERS':
      return {
        ...state,
        players: state.players.map((player, index) => recalcTeamPlayer({
          ...player,
          full_name: player.full_name || `Player ${index + 1} Team Sample User`,
          email: player.email || `player${index + 1}@team.local`,
          phone_number: player.phone_number || `100000${String(index + 1).padStart(4, '0')}`,
          password: player.password || 'Player@123',
          gender: player.gender || (index % 2 ? 'male' : 'female'),
          birthday: player.birthday || '2001-01-15',
          height: player.height || '178',
          weight: player.weight || '74',
          body_fat_percentage: player.body_fat_percentage || '15',
          skeletal_muscle: player.skeletal_muscle || '34',
          progression_type: player.progression_type || 'maintain',
          activity_level: player.activity_level || 'moderate',
        })),
      };
    case 'LOAD_START':
      return { ...state, loading: true, error: '', success: '' };
    case 'LOAD_SUCCESS':
      return { ...state, loading: false, error: '', success: '', ...action.payload };
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SAVE_START':
      return { ...state, saving: true, error: '', success: '' };
    case 'SAVE_SUCCESS':
      return { ...state, saving: false, error: '', success: action.payload };
    case 'SAVE_ERROR':
      return { ...state, saving: false, error: action.payload, success: '' };
    default:
      return state;
  }
}

export function useAddTeam() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, dispatch] = useReducer(addTeamReducer, undefined, buildAddTeamInitialState);

  const editingTeamId = searchParams.get('id') || null;

  useEffect(() => {
    dispatch({ type: 'SET_EDIT_ID', payload: editingTeamId });
  }, [editingTeamId]);

  useEffect(() => {
    if (!editingTeamId) return;

    let mounted = true;
    const load = async () => {
      dispatch({ type: 'LOAD_START' });
      try {
        const response = await apiClient.get(`/api/teams/${encodeURIComponent(editingTeamId)}`);
        const data = response?.data || {};
        if (!mounted) return;

        const players = Array.isArray(data.players)
          ? data.players.map((player, index) => {
              const mapped = createTeamPlayer(index + 1);
              Object.keys(mapped).forEach((key) => {
                if (player[key] !== undefined && player[key] !== null) {
                  mapped[key] = String(player[key]);
                }
              });
              mapped.training_sessions = Array.isArray(player.training_sessions)
                ? player.training_sessions.map((item) => {
                    try { return JSON.parse(item.session_info || '{}'); } catch { return { notes: item.session_info || '' }; }
                  })
                : [];
              mapped.supplements_list = Array.isArray(player.supplements_list)
                ? player.supplements_list.map((item) => {
                    try { return JSON.parse(item.supplement_info || '{}'); } catch { return { notes: item.supplement_info || '' }; }
                  })
                : [];
              return recalcTeamPlayer(mapped);
            })
          : [];

        dispatch({
          type: 'LOAD_SUCCESS',
          payload: {
            editingTeamId,
            teamName: data.team_name || '',
            sportType: data.sport_type || '',
            coachName: data.coach_name || '',
            startDate: data.start_date || '',
            packageSize: Number(data.package_size || players.length || 0),
            players,
          },
        });
      } catch (error) {
        if (!mounted) return;
        dispatch({ type: 'LOAD_ERROR', payload: parseError(error, 'Failed to load team for edit.') });
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [editingTeamId]);

  const setField = (field, value) => dispatch({ type: 'UPDATE_FIELD', payload: { field, value } });
  const setPackageSize = (size) => dispatch({ type: 'SET_PACKAGE_SIZE', payload: size });
  const updatePlayerField = (index, field, value) => dispatch({ type: 'UPDATE_PLAYER', payload: { index, field, value } });
  const autofillPlayers = () => dispatch({ type: 'AUTOFILL_PLAYERS' });

  const canSave = useMemo(() => {
    return Boolean(state.teamName.trim() && state.sportType.trim() && state.coachName.trim() && state.startDate && state.players.length > 0);
  }, [state]);

  const save = async (event) => {
    if (event) event.preventDefault();
    const validationError = validatePlayers(state.players);
    if (validationError) {
      dispatch({ type: 'SAVE_ERROR', payload: validationError });
      return;
    }

    dispatch({ type: 'SAVE_START' });
    const payload = buildTeamPayload(state);

    try {
      if (state.editingTeamId) {
        await apiClient.put(`/api/teams/${encodeURIComponent(state.editingTeamId)}`, payload);
      } else {
        await apiClient.post('/api/player/create', payload);
      }

      dispatch({ type: 'SAVE_SUCCESS', payload: state.editingTeamId ? 'Team updated successfully.' : 'Team created successfully.' });
      window.setTimeout(() => navigate('/clients'), 800);
    } catch (error) {
      dispatch({ type: 'SAVE_ERROR', payload: parseError(error, 'Failed to save team.') });
    }
  };

  return {
    state,
    canSave,
    setField,
    setPackageSize,
    updatePlayerField,
    autofillPlayers,
    save,
  };
}
