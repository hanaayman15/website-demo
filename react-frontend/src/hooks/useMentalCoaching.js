import { useMemo, useReducer } from 'react';

const GOAL_KEY = 'weeklyGoal';
const EXERCISES_KEY = 'completedExercises';
const CHALLENGE_KEY = 'challengeCompleted';
const LAST_COMPLETION_KEY = 'lastCompletionDate';

function safeGet(key, fallback = '') {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const value = localStorage.getItem(key);
      return value ?? fallback;
    }
  } catch {
    // Ignore storage access failures.
  }
  return fallback;
}

function safeSet(key, value) {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage access failures.
  }
}

export function buildMentalInitialState() {
  const today = new Date().toDateString();
  const lastCompletionDate = safeGet(LAST_COMPLETION_KEY, '');
  const storedExercises = safeGet(EXERCISES_KEY, '[]');
  const parsedExercises = (() => {
    try {
      const parsed = JSON.parse(storedExercises);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const completedExercises = lastCompletionDate === today ? parsedExercises : [];
  if (lastCompletionDate !== today) {
    safeSet(EXERCISES_KEY, JSON.stringify([]));
    safeSet(LAST_COMPLETION_KEY, today);
  }

  return {
    weeklyGoal: safeGet(GOAL_KEY, 'Improve competition confidence and overcome pre-race anxiety'),
    completedExercises,
    challengeCompletedAt: safeGet(CHALLENGE_KEY, ''),
  };
}

export function mentalReducer(state, action) {
  switch (action.type) {
    case 'SET_WEEKLY_GOAL':
      return { ...state, weeklyGoal: action.payload };
    case 'MARK_EXERCISE_COMPLETE':
      if (state.completedExercises.includes(action.payload)) return state;
      return {
        ...state,
        completedExercises: [...state.completedExercises, action.payload],
      };
    case 'COMPLETE_CHALLENGE':
      return {
        ...state,
        challengeCompletedAt: action.payload,
      };
    default:
      return state;
  }
}

export function buildProgressSummary(completedExercises = [], total = 3) {
  const done = Array.isArray(completedExercises) ? completedExercises.length : 0;
  const safeTotal = total > 0 ? total : 1;
  return {
    completed: done,
    total,
    percentage: Math.min(100, Math.round((done / safeTotal) * 100)),
    label: `${done}/${total} completed`,
  };
}

export function useMentalCoaching() {
  const [state, dispatch] = useReducer(mentalReducer, undefined, buildMentalInitialState);

  const setWeeklyGoal = (goal) => {
    const normalized = String(goal || '').trim();
    if (!normalized) return;
    dispatch({ type: 'SET_WEEKLY_GOAL', payload: normalized });
    safeSet(GOAL_KEY, normalized);
  };

  const markExerciseComplete = (exerciseKey) => {
    dispatch({ type: 'MARK_EXERCISE_COMPLETE', payload: exerciseKey });
    const next = state.completedExercises.includes(exerciseKey)
      ? state.completedExercises
      : [...state.completedExercises, exerciseKey];
    safeSet(EXERCISES_KEY, JSON.stringify(next));
    safeSet(LAST_COMPLETION_KEY, new Date().toDateString());
  };

  const completeChallenge = () => {
    const timestamp = new Date().toISOString();
    dispatch({ type: 'COMPLETE_CHALLENGE', payload: timestamp });
    safeSet(CHALLENGE_KEY, timestamp);
  };

  const progress = useMemo(() => buildProgressSummary(state.completedExercises, 3), [state.completedExercises]);

  return {
    state,
    progress,
    setWeeklyGoal,
    markExerciseComplete,
    completeChallenge,
  };
}
