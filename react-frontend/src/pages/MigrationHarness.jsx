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
import { buildConsultationPayload } from '../hooks/useSubscriptionPlans';
import {
  buildCompleteResetPayload,
  buildResetRequestPayload,
  buildVerificationPayload,
} from '../hooks/usePasswordRecovery';
import { buildProgressSummary } from '../hooks/useMentalCoaching';
import { buildSupplementLogPayload } from '../hooks/useSupplements';
import { buildHomeSummaryDefaults, buildRecipeModalData } from '../hooks/useClientPortalHome';
import { buildClientSummary, resolveClientServicesLinks } from '../hooks/useClientServicesContext';
import { buildNutritionFields, buildNutritionPayload, calculateNutritionDerived } from '../hooks/useClientNutritionProfile';
import { CLIENT_RECIPES, filterRecipes } from '../hooks/useClientRecipes';
import { buildSignupProfilePayload, buildSignupRegistrationPayload } from '../hooks/useClientSignup';
import { buildAdClientTestPayload, calculateAdClientMetrics } from '../hooks/useAdClientTest';
import { buildAddClientDetailsPayload, recalcAddClientDetails } from '../hooks/useAddClientDetails';
import { buildTeamPayload, createTeamPlayer, recalcTeamPlayer } from '../hooks/useAddTeam';
import { buildDietPlanDraft, buildDietPlanPayload, buildDietPlanSummary } from '../hooks/useDietManagement';
import { buildPdfRequestPayload } from '../hooks/usePdfGenerator';
import { buildTeamViewRow } from '../hooks/useTeamView';
import { buildAuthPayload, candidatePaths } from '../hooks/useAuth';
import { normalizeDoctorDashboardConfig, summarizeTeams } from '../hooks/useDoctorDashboard';
import { buildMeasurementPayload, buildMoodPayload, buildSleepPayload, buildWorkoutPayload } from '../hooks/useReports';
import { buildFullProfilePayload, buildPersonalInfoPayload } from '../hooks/useSettings';
import { buildSessionSnapshot } from '../utils/authSession';
import { safeGet } from '../utils/storageSafe';
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

  const utilityPayloads = useMemo(() => {
    return {
      subscription: buildConsultationPayload({ clientId: 101, plan: 'monthly' }),
      passwordRecovery: {
        request: buildResetRequestPayload('Athlete@Example.com '),
        verify: buildVerificationPayload({ email: 'Athlete@Example.com ', code: '123456' }),
        complete: buildCompleteResetPayload({
          email: 'Athlete@Example.com ',
          code: '123456',
          newPassword: 'newStrongPass123',
        }),
      },
    };
  }, []);

  const staticHelperPayloads = useMemo(() => {
    return {
      mental: {
        progress: buildProgressSummary(['breathing', 'focus'], 3),
      },
      supplements: {
        logPayload: buildSupplementLogPayload({
          clientId: 101,
          supplementName: 'Creatine Monohydrate',
        }),
      },
    };
  }, []);

  const portalPayloads = useMemo(() => {
    return {
      homeDefaults: buildHomeSummaryDefaults(),
      recipePreview: buildRecipeModalData('salmon'),
      serviceLinks: resolveClientServicesLinks(101),
      clientSummary: buildClientSummary(
        {
          full_name: 'Harness Client',
          display_id: 501,
          email: 'harness.client@example.com',
        },
        101
      ),
    };
  }, []);

  const clientWrapperPayloads = useMemo(() => {
    const nutritionFields = buildNutritionFields({
      height: 178,
      weight: 82,
      bodyFat: 15,
      skeletalMuscle: 39,
      activityLevel: 'very_active',
      progressionType: 'maintain',
    });

    return {
      nutrition: {
        derived: calculateNutritionDerived(nutritionFields),
        payload: buildNutritionPayload({
          fields: nutritionFields,
          trainingSessions: [
            {
              name: 'Session A',
              type: 'moderate',
              days: ['Mo', 'Wed'],
              startHour: '06',
              startMin: '00',
              startAmPm: 'PM',
              endHour: '08',
              endMin: '00',
              endAmPm: 'PM',
            },
          ],
          supplements: [{ name: 'Creatine', amount: '5', notes: 'Daily' }],
        }),
      },
      recipes: {
        breakfastSearch: filterRecipes(CLIENT_RECIPES, { filter: 'breakfast', search: 'berries' }),
      },
      signup: {
        registerPayload: buildSignupRegistrationPayload({
          firstName: 'Harness',
          lastName: 'Athlete',
          email: 'Harness@Example.com',
          password: 'strongPass123',
        }),
        profilePayload: buildSignupProfilePayload({
          country: 'Egypt',
          phone: '01000000000',
          sport: 'Football',
        }),
      },
    };
  }, []);

  const rosterPayloads = useMemo(() => {
    const adClientState = calculateAdClientMetrics({
      fullName: 'Harness Client User',
      birthday: '2000-01-01',
      gender: 'Male',
      height: '178',
      weight: '75',
      activityLevel: 'moderate',
      competitionDate: '2026-06-01',
    });

    const detailsState = recalcAddClientDetails({
      fullName: 'Harness Client User',
      clientId: '101',
      phone: '+201000000000',
      birthday: '2000-01-01',
      gender: 'male',
      country: 'Egypt',
      club: 'Harness Club',
      height: '178',
      weight: '75',
      inbodyBmr: '',
      activityLevel: 'moderate',
      sport: 'Football',
      position: 'Midfielder',
      progressionType: 'maintain',
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
      goalWeight: '72',
      priority: 'medium',
      competitionDate: '2026-06-01',
      mentalObservations: '',
      additionalNotes: '',
      training: {
        Monday: { type: 'medium', start: '15:30', end: '17:00' },
        Tuesday: { type: 'medium', start: '15:30', end: '17:00' },
        Wednesday: { type: 'medium', start: '15:30', end: '17:00' },
        Thursday: { type: 'medium', start: '15:30', end: '17:00' },
        Friday: { type: 'low', start: '15:30', end: '17:00' },
        Saturday: { type: 'medium', start: '15:30', end: '17:00' },
        Sunday: { type: 'medium', start: '15:30', end: '17:00' },
      },
    });

    const teamPlayer = recalcTeamPlayer({
      ...createTeamPlayer(1),
      full_name: 'Harness Player Sample User',
      email: 'player@harness.local',
      gender: 'male',
      birthday: '2001-02-01',
      height: '179',
      weight: '76',
      body_fat_percentage: '14',
      skeletal_muscle: '35',
      activity_level: 'moderate',
      progression_type: 'maintain',
    });

    return {
      adClientTestPayload: buildAdClientTestPayload(adClientState),
      addClientDetailsPayload: buildAddClientDetailsPayload(detailsState),
      addTeamPayload: buildTeamPayload({
        teamName: 'Harness Team',
        sportType: 'Football',
        coachName: 'Harness Coach',
        startDate: '2026-03-17',
        packageSize: 1,
        players: [teamPlayer],
      }),
    };
  }, []);

  const finalWrapperPayloads = useMemo(() => {
    const dietDraft = {
      ...buildDietPlanDraft(),
      minCalories: '1600',
      maxCalories: '2100',
      dietType: 'harness seasonal',
    };
    dietDraft.sunday.breakfast = { time: '09:00', en: 'Oats and berries', ar: 'شوفان وتوت' };

    const dietPayload = buildDietPlanPayload(dietDraft);

    const pdfPayload = buildPdfRequestPayload({
      language: 'english',
      clients: [
        {
          id: 101,
          displayId: '501',
          name: 'Harness Client',
          age: 24,
          gender: 'male',
          phone: '+201000000000',
          source: 'Add Client',
          teamName: null,
        },
      ],
    });

    const teamRow = buildTeamViewRow(
      { player_number: 1, id: 101, full_name: 'Harness Player', email: 'p@example.com', phone: '+2010', gender: 'male', height: 178, weight: 75 },
      55,
      true
    );

    return {
      diet: {
        payload: dietPayload,
        summary: buildDietPlanSummary(dietPayload),
      },
      pdf: pdfPayload,
      teamViewRow: teamRow,
    };
  }, []);

  const phaseFivePayloads = useMemo(() => {
    return {
      sessionSnapshot: buildSessionSnapshot(),
      safeStorageRead: safeGet(null, 'missing-key', 'fallback-value'),
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

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Phase 4 Utility Payloads</h2>
        <pre className="react-json-block">{JSON.stringify(utilityPayloads, null, 2)}</pre>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Phase 4 Static/Helper Payloads</h2>
        <pre className="react-json-block">{JSON.stringify(staticHelperPayloads, null, 2)}</pre>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Phase 4 Portal Payloads</h2>
        <pre className="react-json-block">{JSON.stringify(portalPayloads, null, 2)}</pre>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Phase 4 Client Wrapper Payloads</h2>
        <pre className="react-json-block">{JSON.stringify(clientWrapperPayloads, null, 2)}</pre>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Phase 4 Team/Details Payloads</h2>
        <pre className="react-json-block">{JSON.stringify(rosterPayloads, null, 2)}</pre>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Phase 4 Final Wrapper Payloads</h2>
        <pre className="react-json-block">{JSON.stringify(finalWrapperPayloads, null, 2)}</pre>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Phase 5 Session/Persistence Payloads</h2>
        <pre className="react-json-block">{JSON.stringify(phaseFivePayloads, null, 2)}</pre>
      </section>
    </main>
  );
}

export default MigrationHarness;
