import { useNavigate } from 'react-router-dom';
import { useMentalCoaching } from '../hooks/useMentalCoaching';
import ClientPortalNav from '../components/layout/ClientPortalNav';
import '../assets/styles/react-pages.css';

function MentalCoaching() {
  const navigate = useNavigate();
  const { state, progress, markExerciseComplete, completeChallenge } = useMentalCoaching();

  const goToUpgrade = () => {
    navigate('/subscription-plan?upgrade=mental-performance');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <ClientPortalNav activePath="/mental-coaching" isLoggedIn />

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

        <div className="mt-3 bg-white/95 border border-purple-100 rounded-xl px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <p className="text-lg leading-none mt-0.5">🧠</p>
            <p className="text-sm text-gray-700 font-medium">🧠 Unlock your full potential! Upgrade to the Mental Performance Program for advanced mindset training.</p>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700"
            onClick={goToUpgrade}
          >
            🚀 Upgrade Now
          </button>
        </div>
      </div>

      <section className="py-8 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl">🧠</div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Mental Performance Program</h1>
              <p className="text-gray-600 mt-2">Strengthen your mind to unlock your athletic potential</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="bg-gradient-to-r from-purple-100 via-blue-100 to-pink-100 p-8 rounded-3xl border-2 border-purple-200 shadow-sm">
            <p className="text-2xl font-bold text-gray-900 text-center leading-relaxed italic">
              "Your results are not limited by your body — they&apos;re limited by your mindset. Upgrade the mind, and everything else follows."
            </p>
          </div>
        </div>
      </section>

      <section className="pb-12">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-purple-200 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Premium Feature</h2>
            <p className="text-gray-700 mb-5 text-lg">The Mental Performance Program is a premium add-on that requires an additional payment to unlock.</p>
            <button type="button" className="px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold hover:opacity-95" onClick={goToUpgrade}>
              🚀 Upgrade Now
            </button>

            <div className="mt-8 text-left border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="font-semibold text-gray-700">Today&apos;s Exercise Progress</p>
                <p className="font-bold text-purple-700">{progress.label}</p>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500" style={{ width: `${progress.percentage}%` }} />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50" onClick={() => markExerciseComplete('breathing')}>🌬️ Mark Breathing</button>
                <button type="button" className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50" onClick={() => markExerciseComplete('visualization')}>👁️ Mark Visualization</button>
                <button type="button" className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50" onClick={() => markExerciseComplete('focus')}>🎯 Mark Focus</button>
                <button type="button" className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black" onClick={completeChallenge}>✅ Complete Challenge</button>
              </div>
              <p className="text-sm text-gray-500 mt-3 mb-0">Current weekly focus: {state.weeklyGoal}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MentalCoaching;
