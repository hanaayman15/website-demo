import { useEffect, useMemo, useReducer } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/api';
import { hasDoctorAdminSession, resolveAuthRole, resolveAuthToken } from '../utils/authSession';

const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toIsoDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split('/').map((part) => Number(part));
    if (!dd || !mm || !yyyy) return null;
    const parsed = new Date(yyyy, mm - 1, dd);
    if (Number.isNaN(parsed.getTime())) return null;
    const check = `${String(parsed.getDate()).padStart(2, '0')}/${String(parsed.getMonth() + 1).padStart(2, '0')}/${parsed.getFullYear()}`;
    if (check !== raw) return null;
    return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function calculateAge(birthday) {
  if (!birthday) return null;
  const value = String(birthday).trim();
  let birth = new Date(value);
  if (Number.isNaN(birth.getTime()) && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split('/').map((part) => Number(part));
    birth = new Date(yyyy, mm - 1, dd);
  }
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const md = now.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

function defaultTrainingSession(name = 'Training Session 1') {
  return {
    name,
    type: 'low',
    days: ['Mo', 'Wed', 'Fri'],
    start_hour: '06',
    start_min: '00',
    start_ampm: 'PM',
    end_hour: '08',
    end_min: '00',
    end_ampm: 'PM',
  };
}

function defaultSupplement(name = 'Supplement 1') {
  return {
    name,
    amount: '20',
    notes: 'Post workout',
  };
}

function parseSessionInfo(item) {
  try {
    const parsed = JSON.parse(item?.session_info || '{}');
    return {
      name: String(parsed.name || parsed.session || 'Training Session'),
      type: String(parsed.type || 'low'),
      days: Array.isArray(parsed.days) ? parsed.days : [],
      start_hour: String(parsed.start_hour || '12'),
      start_min: String(parsed.start_min || '00'),
      start_ampm: String(parsed.start_ampm || 'AM'),
      end_hour: String(parsed.end_hour || '12'),
      end_min: String(parsed.end_min || '00'),
      end_ampm: String(parsed.end_ampm || 'PM'),
    };
  } catch {
    return defaultTrainingSession();
  }
}

function toSessionItem(session) {
  return { session_info: JSON.stringify(session) };
}

function parseSupplementInfo(item) {
  try {
    const parsed = JSON.parse(item?.supplement_info || '{}');
    return {
      name: String(parsed.name || 'Supplement'),
      amount: parsed.amount === null || parsed.amount === undefined ? '' : String(parsed.amount),
      notes: String(parsed.notes || ''),
    };
  } catch {
    return defaultSupplement('Supplement');
  }
}

function toSupplementItem(supplement) {
  return { supplement_info: JSON.stringify(supplement) };
}

export function createTeamPlayer(playerNumber) {
  return {
    player_number: playerNumber,
    client_id: 'Auto',
    full_name: '',
    phone_country_code: '+20',
    phone_number: '',
    email: '',
    password: '',
    gender: '',
    birthday: '',
    country: 'Egypt',
    club: 'Auto Club',
    religion: 'Other',
    wake_up_time: '',
    sleep_time: '',
    height: '',
    weight: '',
    bmi: '',
    body_fat_percentage: '',
    skeletal_muscle: '',
    body_fat_mass: '',
    muscle_percentage: '',
    age: '',
    bmr: '',
    activity_level: 'active',
    sport: 'Football',
    position: 'Midfielder',
    tdee: '',
    progression_type: 'maintain',
    competition_status: 'none',
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
    training_sessions: [toSessionItem(defaultTrainingSession())],
    supplements_list: [toSupplementItem(defaultSupplement())],
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

  if (height && weight && age) {
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr += gender === 'female' ? -161 : 5;
    next.bmr = bmr.toFixed(1);
  }

  const bmrVal = toNum(next.bmr);
  const factor = ACTIVITY_FACTORS[next.activity_level] || ACTIVITY_FACTORS.active;
  if (bmrVal) {
    const tdee = bmrVal * factor;
    next.tdee = tdee.toFixed(1);

    let calories = tdee;
    if (next.progression_type === 'cut') calories = tdee - 500;
    if (next.progression_type === 'bulk') calories = tdee + 500;
    next.calories = calories.toFixed(1);

    if (weight) {
      const protein = weight * 2.2;
      const fats = (calories * 0.25) / 9;
      const carbs = Math.max((calories - (protein * 4 + fats * 9)) / 4, 0);
      next.protein_target = protein.toFixed(1);
      next.fats_target = fats.toFixed(1);
      next.carbs_target = carbs.toFixed(1);
      next.water_intake = (weight * 0.033).toFixed(1);
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
    start_date: toIsoDate(state.startDate),
    package_size: state.packageSize,
    players: state.players.map((player, index) => ({
      ...player,
      player_number: index + 1,
      birthday: toIsoDate(player.birthday),
      competition_date: toIsoDate(player.competition_date),
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
      minerals: toNum(player.minerals),
      goal_weight: toNum(player.goal_weight),
      days_left: toNum(player.days_left),
      competition_status: player.competition_status || null,
      training_sessions: player.training_sessions || [],
      supplements_list: player.supplements_list || [],
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
  const status = Number(error?.response?.status || 0);
  if (status === 401) {
    return buildMissingAuthMessage() || 'Invalid authentication credentials. Please login via Doctor/Admin Access.';
  }
  if (status === 502) {
    return 'Backend unavailable (502 Bad Gateway). Start/restart backend API server and retry.';
  }
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((item) => {
        if (!item) return '';
        const path = Array.isArray(item.loc) ? item.loc.join('.') : '';
        const msg = item.msg || item.message || '';
        return [path, msg].filter(Boolean).join(': ');
      })
      .filter(Boolean);
    if (msgs.length) return msgs.join(' | ');
  }
  return fallback;
}

function buildMissingAuthMessage() {
  const token = resolveAuthToken();
  const role = String(resolveAuthRole() || '').toLowerCase();
  const doctorSession = hasDoctorAdminSession();
  const missing = [];

  if (!token) missing.push('token');
  if (!(role === 'doctor' || role === 'admin')) missing.push('doctor/admin role');
  if (role === 'doctor' && !doctorSession) missing.push('doctor session flag');

  if (!missing.length) return '';
  return `Invalid authentication credentials. Missing requirement: ${missing.join(', ')}.`;
}

function validatePlayers(players) {
  for (const player of players) {
    const words = String(player.full_name || '').trim().split(/\s+/).filter(Boolean);
    if (words.length < 4) return `Player ${player.player_number}: full name must include at least 4 names.`;
    const phoneDigits = String(player.phone_number || '').replace(/\D/g, '');
    if (phoneDigits.length < 6) return `Player ${player.player_number}: valid phone number is required.`;
    if (!String(player.phone_country_code || '').trim()) return `Player ${player.player_number}: phone country code is required.`;
    if (!player.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(player.email))) return `Player ${player.player_number}: valid email is required.`;
    if (!player.gender) return `Player ${player.player_number}: gender is required.`;
    if (!player.birthday) return `Player ${player.player_number}: birthday is required.`;
    if (!String(player.country || '').trim()) return `Player ${player.player_number}: country is required.`;
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
      if (!action.payload || action.payload < 1) {
        return {
          ...state,
          packageSize: 0,
          players: [],
        };
      }
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
    case 'RECALC_PLAYER': {
      const idx = action.payload;
      return {
        ...state,
        players: state.players.map((item, index) => (index === idx ? recalcTeamPlayer(item) : item)),
      };
    }
    case 'ADD_TRAINING_SESSION': {
      const { playerIndex } = action.payload;
      return {
        ...state,
        players: state.players.map((player, idx) => {
          if (idx !== playerIndex) return player;
          const sessionCount = (player.training_sessions || []).length + 1;
          return {
            ...player,
            training_sessions: [...(player.training_sessions || []), toSessionItem(defaultTrainingSession(`Training Session ${sessionCount}`))],
          };
        }),
      };
    }
    case 'REMOVE_TRAINING_SESSION': {
      const { playerIndex, sessionIndex } = action.payload;
      return {
        ...state,
        players: state.players.map((player, idx) => {
          if (idx !== playerIndex) return player;
          return {
            ...player,
            training_sessions: (player.training_sessions || []).filter((_, i) => i !== sessionIndex),
          };
        }),
      };
    }
    case 'UPDATE_TRAINING_SESSION': {
      const { playerIndex, sessionIndex, field, value } = action.payload;
      return {
        ...state,
        players: state.players.map((player, idx) => {
          if (idx !== playerIndex) return player;
          return {
            ...player,
            training_sessions: (player.training_sessions || []).map((item, i) => {
              if (i !== sessionIndex) return item;
              const parsed = parseSessionInfo(item);
              return toSessionItem({ ...parsed, [field]: value });
            }),
          };
        }),
      };
    }
    case 'TOGGLE_TRAINING_DAY': {
      const { playerIndex, sessionIndex, day } = action.payload;
      return {
        ...state,
        players: state.players.map((player, idx) => {
          if (idx !== playerIndex) return player;
          return {
            ...player,
            training_sessions: (player.training_sessions || []).map((item, i) => {
              if (i !== sessionIndex) return item;
              const parsed = parseSessionInfo(item);
              const exists = parsed.days.includes(day);
              const nextDays = exists ? parsed.days.filter((d) => d !== day) : [...parsed.days, day];
              return toSessionItem({ ...parsed, days: nextDays });
            }),
          };
        }),
      };
    }
    case 'ADD_SUPPLEMENT': {
      const { playerIndex } = action.payload;
      return {
        ...state,
        players: state.players.map((player, idx) => {
          if (idx !== playerIndex) return player;
          const suppCount = (player.supplements_list || []).length + 1;
          return {
            ...player,
            supplements_list: [...(player.supplements_list || []), toSupplementItem(defaultSupplement(`Supplement ${suppCount}`))],
          };
        }),
      };
    }
    case 'REMOVE_SUPPLEMENT': {
      const { playerIndex, supplementIndex } = action.payload;
      return {
        ...state,
        players: state.players.map((player, idx) => {
          if (idx !== playerIndex) return player;
          return {
            ...player,
            supplements_list: (player.supplements_list || []).filter((_, i) => i !== supplementIndex),
          };
        }),
      };
    }
    case 'UPDATE_SUPPLEMENT': {
      const { playerIndex, supplementIndex, field, value } = action.payload;
      return {
        ...state,
        players: state.players.map((player, idx) => {
          if (idx !== playerIndex) return player;
          return {
            ...player,
            supplements_list: (player.supplements_list || []).map((item, i) => {
              if (i !== supplementIndex) return item;
              const parsed = parseSupplementInfo(item);
              return toSupplementItem({ ...parsed, [field]: value });
            }),
          };
        }),
      };
    }
    case 'AUTOFILL_PLAYERS':
      return {
        ...state,
        players: state.players.map((player, index) => recalcTeamPlayer({
          ...player,
          client_id: player.client_id || 'Auto',
          full_name: player.full_name || 'Auto Filled Client Profile Name Team User',
          email: player.email || `autofill_team_${index + 1}@example.com`,
          phone_country_code: player.phone_country_code || '+93',
          phone_number: player.phone_number || '1000000000',
          password: player.password || 'Player@123',
          gender: player.gender || 'male',
          birthday: player.birthday || '2000-01-01',
          country: player.country || 'Egypt',
          club: player.club || 'Auto Club',
          religion: player.religion || 'Other',
          wake_up_time: player.wake_up_time || '07:00',
          sleep_time: player.sleep_time || '22:30',
          sport: player.sport || 'Football',
          position: player.position || 'Midfielder',
          height: player.height || '178',
          weight: player.weight || '78',
          body_fat_percentage: player.body_fat_percentage || '14',
          skeletal_muscle: player.skeletal_muscle || '35',
          progression_type: player.progression_type || 'maintain',
          activity_level: player.activity_level || 'active',
          water_in_body: player.water_in_body || '41',
          minerals: player.minerals || '3.6',
          test_and_record: player.test_and_record || 'Initial assessment completed.',
          injuries: player.injuries || 'No current injuries.',
          mental_notes: player.mental_notes || 'Focused and motivated.',
          food_allergies: player.food_allergies || 'None',
          medical_notes: player.medical_notes || 'No chronic conditions reported.',
          food_likes: player.food_likes || 'Rice, chicken, vegetables',
          food_dislikes: player.food_dislikes || 'Deep fried foods',
          competition_status: player.competition_status || 'none',
          goal_weight: player.goal_weight || '76',
          additional_notes: player.additional_notes || 'Follow-up in 2 weeks.',
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
                if (key === 'training_sessions' || key === 'supplements_list') return;
                if (player[key] !== undefined && player[key] !== null) {
                  mapped[key] = String(player[key]);
                }
              });
              mapped.training_sessions = Array.isArray(player.training_sessions)
                ? player.training_sessions.map((item) => ({ session_info: item.session_info || '{}' }))
                : [];
              mapped.supplements_list = Array.isArray(player.supplements_list)
                ? player.supplements_list.map((item) => ({ supplement_info: item.supplement_info || '{}' }))
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
  const recalcPlayer = (index) => dispatch({ type: 'RECALC_PLAYER', payload: index });
  const addTrainingSession = (playerIndex) => dispatch({ type: 'ADD_TRAINING_SESSION', payload: { playerIndex } });
  const removeTrainingSession = (playerIndex, sessionIndex) => dispatch({ type: 'REMOVE_TRAINING_SESSION', payload: { playerIndex, sessionIndex } });
  const updateTrainingSession = (playerIndex, sessionIndex, field, value) => dispatch({ type: 'UPDATE_TRAINING_SESSION', payload: { playerIndex, sessionIndex, field, value } });
  const toggleTrainingDay = (playerIndex, sessionIndex, day) => dispatch({ type: 'TOGGLE_TRAINING_DAY', payload: { playerIndex, sessionIndex, day } });
  const addSupplement = (playerIndex) => dispatch({ type: 'ADD_SUPPLEMENT', payload: { playerIndex } });
  const removeSupplement = (playerIndex, supplementIndex) => dispatch({ type: 'REMOVE_SUPPLEMENT', payload: { playerIndex, supplementIndex } });
  const updateSupplement = (playerIndex, supplementIndex, field, value) => dispatch({ type: 'UPDATE_SUPPLEMENT', payload: { playerIndex, supplementIndex, field, value } });
  const autofillPlayers = () => dispatch({ type: 'AUTOFILL_PLAYERS' });

  const canSave = useMemo(() => {
    return Boolean(state.teamName.trim() && state.sportType.trim() && state.coachName.trim() && state.startDate && state.players.length > 0);
  }, [state]);

  const save = async (event) => {
    if (event) event.preventDefault();

    const missingAuthMessage = buildMissingAuthMessage();
    if (missingAuthMessage) {
      dispatch({ type: 'SAVE_ERROR', payload: missingAuthMessage });
      return;
    }

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
    recalcPlayer,
    addTrainingSession,
    removeTrainingSession,
    updateTrainingSession,
    toggleTrainingDay,
    addSupplement,
    removeSupplement,
    updateSupplement,
    autofillPlayers,
    save,
    parseSessionInfo,
    parseSupplementInfo,
  };
}
