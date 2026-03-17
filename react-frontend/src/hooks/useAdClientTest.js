import { useMemo, useReducer } from 'react';

export function buildAdClientTestInitialState() {
  return {
    fullName: '',
    birthday: '',
    gender: 'Male',
    height: '',
    weight: '',
    activityLevel: 'moderate',
    bmi: '',
    bmr: '',
    tdee: '',
    cutCalories: '',
    maintainCalories: '',
    bulkCalories: '',
    protein: '',
    carbs: '',
    fats: '',
    waterIntake: '',
    competitionDate: '',
    daysLeft: '',
  };
}

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
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age > 0 ? age : null;
}

export function calculateAdClientMetrics(state) {
  const next = { ...state };
  const height = toNum(state.height);
  const weight = toNum(state.weight);
  const age = calculateAge(state.birthday);
  const gender = String(state.gender || 'Male').toLowerCase();

  if (height && weight && height > 0) {
    next.bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);
  } else {
    next.bmi = '';
  }

  if (height && weight && age) {
    const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161);
    next.bmr = Math.round(bmr).toString();
  } else {
    next.bmr = '';
  }

  const factors = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    'very-active': 1.9,
    'extremely-active': 2.1,
  };

  const bmrVal = toNum(next.bmr);
  const factor = factors[state.activityLevel] || 1.55;
  if (bmrVal) {
    const tdee = Math.round(bmrVal * factor);
    next.tdee = String(tdee);
    next.cutCalories = String(Math.round(tdee - 500));
    next.maintainCalories = String(Math.round(tdee));
    next.bulkCalories = String(Math.round(tdee + 500));
  } else {
    next.tdee = '';
    next.cutCalories = '';
    next.maintainCalories = '';
    next.bulkCalories = '';
  }

  if (weight && toNum(next.tdee)) {
    const protein = weight * 2;
    const fats = weight * 1;
    const carbs = Math.max((toNum(next.tdee) - (protein * 4 + fats * 9)) / 4, 0);
    next.protein = Math.round(protein).toString();
    next.fats = Math.round(fats).toString();
    next.carbs = Math.round(carbs).toString();
    next.waterIntake = (weight * 0.033).toFixed(1);
  } else {
    next.protein = '';
    next.fats = '';
    next.carbs = '';
    next.waterIntake = '';
  }

  if (state.competitionDate) {
    const today = new Date();
    const comp = new Date(state.competitionDate);
    const days = Math.ceil((comp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    next.daysLeft = Number.isFinite(days) ? String(Math.max(days, 0)) : '';
  } else {
    next.daysLeft = '';
  }

  return next;
}

export function buildAdClientTestPayload(state) {
  return {
    full_name: state.fullName || null,
    birthday: state.birthday || null,
    gender: state.gender || null,
    height: toNum(state.height),
    weight: toNum(state.weight),
    activity_level: state.activityLevel || null,
    bmi: toNum(state.bmi),
    bmr: toNum(state.bmr),
    tdee: toNum(state.tdee),
    calories_cut: toNum(state.cutCalories),
    calories_maintain: toNum(state.maintainCalories),
    calories_bulk: toNum(state.bulkCalories),
    protein_target: toNum(state.protein),
    carbs_target: toNum(state.carbs),
    fats_target: toNum(state.fats),
    water_intake: toNum(state.waterIntake),
    competition_date: state.competitionDate || null,
    days_left: toNum(state.daysLeft),
  };
}

export function adClientTestReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return calculateAdClientMetrics({
        ...state,
        [action.payload.field]: action.payload.value,
      });
    case 'AUTOFILL':
      return calculateAdClientMetrics({
        ...state,
        fullName: 'Autofill Client Sample User',
        birthday: '2000-01-01',
        gender: 'Male',
        height: '178',
        weight: '75',
        activityLevel: 'active',
      });
    default:
      return state;
  }
}

export function useAdClientTest() {
  const [state, dispatch] = useReducer(adClientTestReducer, undefined, buildAdClientTestInitialState);

  const payloadPreview = useMemo(() => buildAdClientTestPayload(state), [state]);

  return {
    state,
    payloadPreview,
    updateField: (field, value) => dispatch({ type: 'UPDATE_FIELD', payload: { field, value } }),
    autofill: () => dispatch({ type: 'AUTOFILL' }),
  };
}
