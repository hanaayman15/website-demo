import { useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';

const TRAINING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function safeStorageGet(key, fallback = '') {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      return localStorage.getItem(key) || fallback;
    }
  } catch {
    // Ignore storage access failures in restricted runtimes.
  }
  return fallback;
}

function trainingDefaults() {
  return Object.fromEntries(
    TRAINING_DAYS.map((day) => [day, { type: 'medium', start: '15:30', end: '17:00' }])
  );
}

export function buildAddClientDetailsInitialState() {
  return {
    saving: false,
    error: '',
    success: '',
    isLoading: true,
    fullName: safeStorageGet('clientFullName', ''),
    clientId: safeStorageGet('currentClientId', ''),
    phone: safeStorageGet('clientPhone', ''),
    birthday: '',
    gender: '',
    country: safeStorageGet('clientPhoneCountry', 'Egypt'),
    club: '',
    height: '',
    weight: '',
    bmi: '',
    bodyFat: '',
    skeletalMuscle: '',
    bodyFatMass: '',
    musclePercent: '',
    bmr: '',
    inbodyBmr: '',
    activityLevel: '',
    sport: safeStorageGet('clientSport', ''),
    position: '',
    tdee: '',
    progressionType: '',
    proteinTarget: '',
    carbsTarget: '',
    fatsTarget: '',
    waterIntake: '',
    waterInBody: '',
    minerals: '',
    injuries: '',
    foodAllergies: '',
    medicalNotes: '',
    foodLikes: '',
    foodDislikes: '',
    supplements: '',
    goalWeight: '',
    priority: 'medium',
    competitionDate: '',
    mentalObservations: '',
    additionalNotes: '',
    religion: '',
    training: trainingDefaults(),
  };
}

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function calculateAge(birthday) {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

export function recalcAddClientDetails(state) {
  const next = { ...state };
  const height = toNum(next.height);
  const weight = toNum(next.weight);

  if (height && weight && height > 0) {
    next.bmi = (weight / Math.pow(height / 100, 2)).toFixed(2);
  } else {
    next.bmi = '';
  }

  const age = calculateAge(next.birthday);
  const gender = String(next.gender || '').toLowerCase();
  if (height && weight && age !== null && gender) {
    const bmr = gender === 'male'
      ? 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
      : 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
    next.bmr = bmr.toFixed(2);
  }

  const bmrVal = toNum(next.bmr);
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very: 1.725,
    extremely: 1.9,
  };
  if (bmrVal && next.activityLevel) {
    next.tdee = (bmrVal * (multipliers[next.activityLevel] || 1.5)).toFixed(2);
  }

  if (weight && toNum(next.tdee)) {
    if (!toNum(next.proteinTarget)) next.proteinTarget = (weight * 1.8).toFixed(1);
    if (!toNum(next.fatsTarget)) next.fatsTarget = ((toNum(next.tdee) * 0.25) / 9).toFixed(1);
    const protein = toNum(next.proteinTarget) || 0;
    const fats = toNum(next.fatsTarget) || 0;
    next.carbsTarget = Math.max((toNum(next.tdee) - protein * 4 - fats * 9) / 4, 0).toFixed(1);
    next.waterIntake = (weight * 0.035).toFixed(1);
    next.waterInBody = (weight * 0.55).toFixed(1);
    next.minerals = `${(weight * 0.055).toFixed(1)} kg`;
  }

  if (weight && toNum(next.bodyFat)) {
    next.bodyFatMass = (weight * (toNum(next.bodyFat) / 100)).toFixed(1);
  }

  if (weight && toNum(next.skeletalMuscle)) {
    next.musclePercent = ((toNum(next.skeletalMuscle) / weight) * 100).toFixed(1);
  }

  if (!next.inbodyBmr && next.bmr) {
    next.inbodyBmr = next.bmr;
  }

  return next;
}

export function buildAddClientDetailsPayload(state) {
  const trainingDetails = TRAINING_DAYS.map((day) => ({
    day,
    type: state.training[day]?.type || 'medium',
    start: state.training[day]?.start || '',
    end: state.training[day]?.end || '',
  }));

  const primaryTraining = trainingDetails.find((item) => item.start) || trainingDetails[4] || trainingDetails[0];

  return {
    phone: state.phone || null,
    birthday: state.birthday || null,
    gender: state.gender || null,
    country: state.country || null,
    club: state.club || null,
    sport: state.sport || null,
    position: state.position || null,
    religion: state.religion || null,
    age: toNum(calculateAge(state.birthday)),
    height: toNum(state.height),
    weight: toNum(state.weight),
    bmi: toNum(state.bmi),
    body_fat_percentage: toNum(state.bodyFat),
    skeletal_muscle: toNum(state.skeletalMuscle),
    bmr: toNum(state.bmr),
    tdee: toNum(state.tdee),
    activity_level: state.activityLevel || null,
    calories: toNum(state.tdee),
    protein_target: toNum(state.proteinTarget),
    carbs_target: toNum(state.carbsTarget),
    fats_target: toNum(state.fatsTarget),
    water_intake: toNum(state.waterIntake),
    water_in_body: toNum(state.waterInBody),
    minerals: toNum(String(state.minerals || '').replace(/[^0-9.\-]/g, '')),
    injuries: state.injuries || null,
    food_allergies: state.foodAllergies || null,
    medical_notes: state.medicalNotes || null,
    food_likes: state.foodLikes || null,
    food_dislikes: state.foodDislikes || null,
    supplements: state.supplements || null,
    additional_notes: state.additionalNotes || null,
    mental_notes: state.mentalObservations || null,
    priority: state.priority || 'medium',
    competition_date: state.competitionDate || null,
    goal_weight: toNum(state.goalWeight),
    progression_type: state.progressionType || null,
    training_details: trainingDetails,
    training_start_time: primaryTraining?.start || null,
    training_time: primaryTraining?.start || null,
    training_end_time: primaryTraining?.end || null,
  };
}

export function addClientDetailsReducer(state, action) {
  switch (action.type) {
    case 'LOAD_PROFILE':
      return recalcAddClientDetails({
        ...state,
        ...action.payload,
        isLoading: false,
      });
    case 'UPDATE_FIELD':
      return recalcAddClientDetails({ ...state, [action.payload.field]: action.payload.value });
    case 'UPDATE_TRAINING': {
      const { day, field, value } = action.payload;
      return {
        ...state,
        training: {
          ...state.training,
          [day]: {
            ...state.training[day],
            [field]: value,
          },
        },
      };
    }
    case 'SAVE_START':
      return { ...state, saving: true, error: '', success: '' };
    case 'SAVE_SUCCESS':
      return { ...state, saving: false, error: '', success: action.payload };
    case 'SAVE_ERROR':
      return { ...state, saving: false, error: action.payload, success: '' };
    case 'AUTOFILL':
      return recalcAddClientDetails({
        ...state,
        fullName: state.fullName || 'Autofill Client Profile User',
        birthday: state.birthday || '2000-01-01',
        gender: state.gender || 'male',
        country: state.country || 'Egypt',
        height: state.height || '178',
        weight: state.weight || '75',
        activityLevel: state.activityLevel || 'moderate',
        sport: state.sport || 'Football',
      });
    default:
      return state;
  }
}

function parseApiError(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  return fallback;
}

export function useAddClientDetails() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(addClientDetailsReducer, undefined, buildAddClientDetailsInitialState);

  // Load existing profile data on component mount
  useEffect(() => {
    const loadExistingProfile = async () => {
      try {
        const response = await apiClient.get('/api/client/profile');
        const profile = response?.data || {};
        
        if (profile.id) {
          // Merge existing profile data with state
          dispatch({
            type: 'LOAD_PROFILE',
            payload: {
              fullName: profile.full_name || profile.fullName || '',
              phone: profile.phone || '',
              birthday: profile.birthday || '',
              gender: profile.gender || '',
              country: profile.country || '',
              club: profile.club || '',
              sport: profile.sport || '',
              position: profile.position || '',
              religion: profile.religion || '',
              activityLevel: profile.activity_level || profile.activityLevel || '',
              height: profile.height || '',
              weight: profile.weight || '',
              bmi: profile.bmi || '',
              bodyFat: profile.body_fat_percentage || profile.bodyFat || '',
              skeletalMuscle: profile.skeletal_muscle || profile.skeletalMuscle || '',
              bmr: profile.bmr || '',
              tdee: profile.tdee || '',
              proteinTarget: profile.protein_target || profile.proteinTarget || '',
              carbsTarget: profile.carbs_target || profile.carbsTarget || '',
              fatsTarget: profile.fats_target || profile.fatsTarget || '',
              waterIntake: profile.water_intake || profile.waterIntake || '',
              minerals: profile.minerals || '',
              injuries: profile.injuries || '',
              foodAllergies: profile.food_allergies || profile.foodAllergies || '',
              medicalNotes: profile.medical || profile.medicalNotes || '',
              foodLikes: profile.food_likes || profile.foodLikes || '',
              foodDislikes: profile.food_dislikes || profile.foodDislikes || '',
              supplements: profile.supplements || '',
              goalWeight: profile.goal_weight || profile.goalWeight || '',
              priority: profile.priority || 'medium',
              competitionDate: profile.competition_date || profile.competitionDate || '',
              clientId: profile.id || profile.display_id || '',
              progressionType: profile.progression_type || profile.progressionType || '',
              additionalNotes: profile.additional_notes || profile.additionalNotes || '',
              mentalObservations: profile.mental_observation || profile.mentalObservations || '',
            },
          });
        }
      } catch (error) {
        console.warn('[ADD_CLIENT_DETAILS] Could not load existing profile:', error);
      }
    };

    loadExistingProfile();
  }, []);

  const updateField = (field, value) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { field, value } });
  };

  const updateTraining = (day, field, value) => {
    dispatch({ type: 'UPDATE_TRAINING', payload: { day, field, value } });
  };

  const autofill = () => {
    dispatch({ type: 'AUTOFILL' });
  };

  const save = async (event) => {
    if (event) event.preventDefault();

    const names = String(state.fullName || '').trim().split(/\s+/).filter(Boolean);
    if (names.length < 4) {
      dispatch({ type: 'SAVE_ERROR', payload: 'Please enter at least 4 names in Full Name.' });
      return;
    }

    dispatch({ type: 'SAVE_START' });

    const payload = buildAddClientDetailsPayload(state);

    try {
      const payload = buildAddClientDetailsPayload(state);
      
      // Log what we're trying to send
      console.log('[ADD_CLIENT_DETAILS] Sending payload:', payload);

      const response = await apiClient.put('/api/client/profile', payload);
      
      // Log what backend returned
      console.log('[ADD_CLIENT_DETAILS] Backend response:', response?.data || {});

      let confirmedClientId = Number(safeStorageGet('currentClientId', '0')) || 0;
      
      // Fetch the confirmed client profile to get the real ID
      try {
        const profileResponse = await apiClient.get('/api/client/profile');
        const profile = profileResponse?.data || {};
        confirmedClientId = profile?.id || confirmedClientId;
        if (confirmedClientId) {
          localStorage.setItem('currentClientId', String(confirmedClientId));
        }
      } catch {
        // If profile fetch fails, use best-guess ID
      }

      const cacheData = {
        id: confirmedClientId || null,
        name: state.fullName,
        full_name: state.fullName,
        fullProfileForm: state,
        weight: state.weight,
        height: state.height,
        bmi: state.bmi,
        bmr: state.bmr,
        tdee: state.tdee,
        proteinTarget: state.proteinTarget,
        carbsTarget: state.carbsTarget,
        fatsTarget: state.fatsTarget,
        protein_target: state.proteinTarget,
        carbs_target: state.carbsTarget,
        fats_target: state.fatsTarget,
        goal_weight: state.goalWeight,
        competition_date: state.competitionDate,
        activity_level: state.activityLevel,
        body_fat_percentage: state.bodyFat,
        skeletal_muscle: state.skeletalMuscle,
        water_in_body: state.waterInBody,
        calories: state.tdee,
        waterIntake: state.waterIntake,
        water_intake: state.waterIntake,
        goalWeight: state.goalWeight,
        supplements: state.supplements,
        injuries: state.injuries,
        food_allergies: state.foodAllergies,
        medical_notes: state.medicalNotes,
        food_likes: state.foodLikes,
        food_dislikes: state.foodDislikes,
        additional_notes: state.additionalNotes,
        mental_notes: state.mentalObservations,
      };

      try {
        localStorage.setItem('clientDashboardCache', JSON.stringify(cacheData));
      } catch {
        // Ignore cache persistence issues.
      }
      if (confirmedClientId) {
        try {
          localStorage.setItem(`clientDashboardCache_${confirmedClientId}`, JSON.stringify(cacheData));
          localStorage.setItem(`clientFullProfile_${confirmedClientId}`, JSON.stringify(state));
          localStorage.setItem(`clientData_${confirmedClientId}`, JSON.stringify(cacheData));
        } catch {
          // Ignore cache persistence issues.
        }
      }

      dispatch({ type: 'SAVE_SUCCESS', payload: 'Profile saved successfully. Redirecting to dashboard...' });

      window.setTimeout(() => {
        navigate('/client-dashboard');
      }, 700);
    } catch (error) {
      dispatch({ type: 'SAVE_ERROR', payload: parseApiError(error, 'Failed to save profile details.') });
    }
  };

  useEffect(() => {
    if (!state.country && safeStorageGet('clientPhoneCountry', '')) {
      updateField('country', safeStorageGet('clientPhoneCountry', ''));
    }
  }, [state.country]);

  return {
    state,
    trainingDays: TRAINING_DAYS,
    updateField,
    updateTraining,
    autofill,
    save,
  };
}
