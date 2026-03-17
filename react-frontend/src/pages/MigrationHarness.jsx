import { useMemo, useReducer, useState } from 'react';
import {
  buildInitialProgramsState,
  buildProgramsPayload,
  programsReducer,
} from '../hooks/useClientDetailReducer';
import {
  buildDashboardInitialState,
  buildTodayMacrosPayload,
  dashboardDataReducer,
} from '../hooks/useDashboardDataReducer';
import { buildAuthPayload, candidatePaths } from '../hooks/useAuth';
import { normalizeDoctorDashboardConfig, summarizeTeams } from '../hooks/useDoctorDashboard';
import { buildMeasurementPayload, buildMoodPayload, buildSleepPayload, buildWorkoutPayload } from '../hooks/useReports';
import { buildFullProfilePayload, buildPersonalInfoPayload } from '../hooks/useSettings';
import '../assets/styles/react-pages.css';

function MigrationHarness() {
  const [programsState, programsDispatch] = useReducer(programsReducer, undefined, buildInitialProgramsState);
  const [dashboardState, dashboardDispatch] = useReducer(dashboardDataReducer, undefined, buildDashboardInitialState);
  const [selectedDay, setSelectedDay] = useState('Monday');

  const mealsForDay = programsState.dayMeals[selectedDay] || [];

  const programsPayload = useMemo(() => buildProgramsPayload(programsState), [programsState]);

  const macrosPayload = useMemo(() => {
    const meals = mealsForDay.map((meal, index) => ({
      mealId: meal.id || `meal-${index + 1}`,
      mealKey: String(meal.type || '').toLowerCase(),
      mealLabel: meal.type || `Meal ${index + 1}`,
      scheduledTime: meal.time || 'N/A',
      protein: Number(meal.protein || 0),
      carbs: Number(meal.carbs || 0),
      fats: Number(meal.fats || 0),
      calories: Number(meal.calories || 0),
    }));

    const statuses = Object.fromEntries(meals.map((m) => [m.mealId, 'completed']));
    return buildTodayMacrosPayload(meals, statuses, {
      target: { calories: 2200, protein: 180, carbs: 260, fats: 70 },
      consumed: { calories: 0, protein: 0, carbs: 0, fats: 0 },
    });
  }, [mealsForDay]);

  const reportsPayloads = useMemo(() => {
    return {
      measurement: buildMeasurementPayload({
        currentClientId: 101,
        weight: 82.5,
        bodyFat: 16.2,
        muscleMass: 41.8,
      }),
      workout: buildWorkoutPayload({
        currentClientId: 101,
        workoutName: 'Upper Body Session',
      }),
      mood: buildMoodPayload({
        currentClientId: 101,
        moodValue: 8,
      }),
      sleep: buildSleepPayload({
        currentClientId: 101,
        sleepHours: 7.5,
      }),
    };
  }, []);

  const settingsPayloads = useMemo(() => {
    return {
      personal: buildPersonalInfoPayload({
        fullName: 'Harness User Full Name Example',
        phone: '+20 1000000000',
        country: 'Egypt',
      }),
      fullProfile: buildFullProfilePayload({
        fullName: 'Harness User Full Name Example',
        phone: '+20 1000000000',
        birthday: '2000-01-01',
        gender: 'male',
        country: 'Egypt',
        club: 'Harness Club',
        sport: 'Football',
        height: 178,
        weight: 80,
        bodyFat: 15,
        skeletalMuscle: 40,
        activityLevel: 'moderately_active',
        goalWeight: 75,
        foodAllergies: '',
        injuries: '',
        foodLikes: 'Rice',
        foodDislikes: 'Sugar',
        additionalNotes: 'Harness preview',
      }),
    };
  }, []);

  const doctorPayloads = useMemo(() => {
    const signupPayload = buildAuthPayload('signup', {
      fullName: 'Doctor Harness User',
      email: 'doctor.harness@example.com',
      password: 'doctor123',
    });

    const loginPayload = buildAuthPayload('login', {
      email: 'doctor.harness@example.com',
      password: 'doctor123',
    });

    const adminPayload = buildAuthPayload('admin', {
      email: 'admin@demo.com',
      password: 'admin123',
    });

    const normalizedDashboard = normalizeDoctorDashboardConfig({
      quick_actions_title: 'Harness Dashboard',
      quick_actions_description: 'Harness summary',
      navigation: [{ label: 'Clients', href: 'clients.html' }],
      modules: [{ label: 'Clients', href: 'clients.html', description: 'Legacy wording' }],
    });

    const teamSummary = summarizeTeams([
      { id: 1, team_name: 'A', players_count: 22 },
      { id: 2, team_name: 'B', players_count: 18 },
    ]);

    return {
      endpointCandidates: {
        doctorLogin: candidatePaths('/doctor/login'),
        doctorSignup: candidatePaths('/doctor/signup'),
        adminLogin: candidatePaths('/admin/login'),
      },
      payloads: {
        signupPayload,
        loginPayload,
        adminPayload,
      },
      normalizedDashboard,
      teamSummary,
    };
  }, []);

  return (
    <main className="react-page-wrap react-grid" style={{ gap: '1rem' }}>
      <section className="react-panel">
        <h1 style={{ marginTop: 0 }}>Migration Harness</h1>
        <p style={{ marginBottom: 0 }}>
          Local reducer simulation for ClientDetail and Dashboard payloads.
        </p>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>ClientDetail Reducer</h2>
        <div className="react-inline-actions">
          <button className="react-btn" type="button" onClick={() => programsDispatch({ type: 'ADD_MEAL', payload: { dayName: selectedDay } })}>
            Add Meal
          </button>
          <button
            className="react-btn react-btn-ghost"
            type="button"
            onClick={() => programsDispatch({ type: 'UPDATE_NOTES', payload: `Updated at ${new Date().toISOString()}` })}
          >
            Update Notes
          </button>
        </div>

        <label>
          <span className="react-label">Selected Day</span>
          <select className="react-input" value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)}>
            {Object.keys(programsState.dayMeals).map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </label>

        <pre className="react-json-block">{JSON.stringify(programsPayload.mealSwapsPayload, null, 2)}</pre>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Dashboard Reducer</h2>
        <div className="react-inline-actions">
          <button
            className="react-btn"
            type="button"
            onClick={() =>
              dashboardDispatch({
                type: 'LOAD_SUCCESS',
                payload: {
                  profile: { full_name: 'Harness Client' },
                  todayMeals: [],
                  mealStatuses: {},
                  macro: {
                    target: { calories: 2200, protein: 180, carbs: 260, fats: 70 },
                    consumed: { calories: 0, protein: 0, carbs: 0, fats: 0 },
                    totalMeals: 0,
                    completeMeals: 0,
                    pendingMeals: 0,
                  },
                },
              })
            }
          >
            Simulate Load
          </button>
          <button
            className="react-btn react-btn-ghost"
            type="button"
            onClick={() =>
              dashboardDispatch({
                type: 'SET_BACKEND_MACRO',
                payload: {
                  consumed_calories: 900,
                  consumed_protein: 70,
                  consumed_carbs: 115,
                  consumed_fats: 30,
                  complete_meals: 3,
                  total_meals: 6,
                },
              })
            }
          >
            Simulate Backend Macro
          </button>
        </div>

        <pre className="react-json-block">{JSON.stringify(dashboardState.macro, null, 2)}</pre>
        <pre className="react-json-block">{JSON.stringify(macrosPayload, null, 2)}</pre>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Phase 4 Reports Payloads</h2>
        <pre className="react-json-block">{JSON.stringify(reportsPayloads, null, 2)}</pre>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Phase 4 Settings Payloads</h2>
        <pre className="react-json-block">{JSON.stringify(settingsPayloads, null, 2)}</pre>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Phase 4 Doctor/Auth Payloads</h2>
        <pre className="react-json-block">{JSON.stringify(doctorPayloads, null, 2)}</pre>
      </section>
    </main>
  );
}

export default MigrationHarness;
