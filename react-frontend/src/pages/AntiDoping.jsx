import { useNavigate } from 'react-router-dom';
import ClientPortalNav from '../components/layout/ClientPortalNav';
import '../assets/styles/react-pages.css';

function AntiDoping() {
  const navigate = useNavigate();

  const goToUpgrade = () => {
    navigate('/subscription-plan?upgrade=anti-doping');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <ClientPortalNav activePath="/anti-doping" isLoggedIn />

      <div className="container mx-auto px-6 pt-6">
        <div className="bg-white/95 border border-blue-100 rounded-xl px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <p className="text-lg leading-none mt-0.5">😴</p>
            <p className="text-sm text-gray-700 font-medium">💤 Don&apos;t forget: Quality sleep is crucial for recovery! Aim for 7-9 hours tonight.</p>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            onClick={() => navigate('/progress-tracking')}
          >
            📝 Log Sleep
          </button>
        </div>

        <div className="mt-3 bg-white/95 border border-emerald-100 rounded-xl px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <p className="text-lg leading-none mt-0.5">🧪</p>
            <p className="text-sm text-gray-700 font-medium">🛡️ Stay competition-ready: verify every supplement and avoid unapproved products before event week.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
              onClick={() => navigate('/client-dashboard')}
            >
              💊 Review Supplements
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-gray-800 text-white text-sm font-semibold hover:bg-black"
              onClick={() => navigate('/progress')}
            >
              📈 Update Progress
            </button>
          </div>
        </div>
      </div>

      <section className="py-10 bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-gray-200">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold text-gray-900">Anti-Doping Safety Hub</h1>
          <p className="text-gray-600 mt-2 max-w-3xl">Protect your career with safer supplement use, batch checks, and a clean protocol before competition days.</p>
        </div>
      </section>

      <section className="py-6">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="bg-gradient-to-r from-emerald-100 via-teal-100 to-blue-100 p-8 rounded-3xl border-2 border-emerald-200 shadow-sm">
            <p className="text-2xl font-bold text-gray-900 text-center leading-relaxed italic">
              "Discipline is the strongest protection: what you choose off the field protects who you are on the field."
            </p>
          </div>
        </div>
      </section>

      <section className="pb-12">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-emerald-200 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Premium Feature</h2>
            <p className="text-gray-700 mb-6 text-lg">Anti-Doping guidance is a premium add-on and requires an extra payment to unlock this feature.</p>
            <button type="button" className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-bold hover:opacity-95" onClick={goToUpgrade}>
              🚀 Upgrade Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AntiDoping;
