import { createBrowserRouter } from 'react-router-dom';
import About from './pages/About';
import AccountRecovery from './pages/AccountRecovery';
import AdClientTest from './pages/AdClientTest';
import AddTeam from './pages/AddTeam';
import AddClientDetails from './pages/AddClientDetails';
import AddClient from './pages/AddClient';
import AntiDoping from './pages/AntiDoping';
import ClientDashboard from './pages/ClientDashboard';
import ClientDetail from './pages/ClientDetail';
import ClientHome from './pages/ClientHome';
import ClientLogin from './pages/ClientLogin';
import ClientMain from './pages/ClientMain';
import ClientNutritionProfile from './pages/ClientNutritionProfile';
import ClientRecipes from './pages/ClientRecipes';
import ClientServices from './pages/ClientServices';
import ClientSignup from './pages/ClientSignup';
import Clients from './pages/Clients';
import Contact from './pages/Contact';
import DashboardTemplate from './pages/DashboardTemplate';
import DietManagement from './pages/DietManagement';
import DiagnosticsPage from './pages/DiagnosticsPage';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorAuth from './pages/DoctorAuth';
import Features from './pages/Features';
import ForgotPassword from './pages/ForgotPassword';
import Index from './pages/Index';
import MentalCoaching from './pages/MentalCoaching';
import MigrationHarness from './pages/MigrationHarness';
import NextCheckin from './pages/NextCheckin';
import PdfGenerator from './pages/PdfGenerator';
import Plans from './pages/Plans';
import ProfileSetup from './pages/ProfileSetup';
import ProgressTracking from './pages/ProgressTracking';
import Progress from './pages/Progress';
import Resources from './pages/Resources';
import RouteError from './pages/RouteError';
import Settings from './pages/Settings';
import SubscriptionPlan from './pages/SubscriptionPlan';
import SuccessStories from './pages/SuccessStories';
import Supplements from './pages/Supplements';
import TeamView from './pages/TeamView';
import TestApi from './pages/TestApi';
import TestConnection from './pages/TestConnection';
import TestInput from './pages/TestInput';
import NotFound from './pages/NotFound';
//import ClientDashboardEnhanced from './pages/ClientDashboardEnhanced';

const routes = [
  { path: '/login', element: <ClientLogin /> },
  { path: '/dashboard', element: <ClientDashboard /> },
  { path: '/diagnostics', element: <DiagnosticsPage /> },
  { path: '/about', element: <About /> },
  { path: '/account-recovery', element: <AccountRecovery /> },
  { path: '/ad-client-test', element: <AdClientTest /> },
  { path: '/add-team', element: <AddTeam /> },
  { path: '/add-client-details', element: <AddClientDetails /> },
  { path: '/add-client', element: <AddClient /> },
  { path: '/anti-doping', element: <AntiDoping /> },
  { path: '/client-dashboard', element: <ClientDashboard /> },
  { path: '/client-detail', element: <ClientDetail /> },
  { path: '/client-home', element: <ClientHome /> },
  { path: '/client-login', element: <ClientLogin /> },
  { path: '/client-main', element: <ClientMain /> },
  { path: '/client-nutrition-profile', element: <ClientNutritionProfile /> },
  { path: '/client-recipes', element: <ClientRecipes /> },
  { path: '/client-services', element: <ClientServices /> },
  { path: '/client-signup', element: <ClientSignup /> },
  { path: '/clients', element: <Clients /> },
  { path: '/contact', element: <Contact /> },
  { path: '/dashboard-template', element: <DashboardTemplate /> },
  { path: '/diet-management', element: <DietManagement /> },
  { path: '/doctor-dashboard', element: <DoctorDashboard /> },
  { path: '/doctor-auth', element: <DoctorAuth /> },
  { path: '/features', element: <Features /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/', element: <Index /> },
  { path: '/mental-coaching', element: <MentalCoaching /> },
  { path: '/migration-harness', element: <MigrationHarness /> },
  { path: '/next-checkin', element: <NextCheckin /> },
  { path: '/pdf-generator', element: <PdfGenerator /> },
  { path: '/plans', element: <Plans /> },
  { path: '/profile-setup', element: <ProfileSetup /> },
  { path: '/progress-tracking', element: <ProgressTracking /> },
  { path: '/progress', element: <Progress /> },
  { path: '/resources', element: <Resources /> },
  { path: '/settings', element: <Settings /> },
  { path: '/subscription-plan', element: <SubscriptionPlan /> },
  { path: '/success-stories', element: <SuccessStories /> },
  { path: '/supplements', element: <Supplements /> },
  { path: '/team-view', element: <TeamView /> },
  { path: '/test-api', element: <TestApi /> },
  { path: '/test-connection', element: <TestConnection /> },
  { path: '/test-input', element: <TestInput /> },
  { path: '*', element: <NotFound /> },
  //{ path: '/client-dashboard-enhanced', element: <ClientDashboardEnhanced /> },
];

export const router = createBrowserRouter(
  routes.map((route) => ({
    ...route,
    errorElement: <RouteError />,
  }))
);
