import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import ClientPortalNav from '../components/layout/ClientPortalNav';

const ACCENT = '#6eabf2';

function formatLongDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatWeight(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '--';
  return `${n.toFixed(1)} kg`;
}

function buildInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'AM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getTodayName() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

function normalizeMealCategory(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function formatDateInput(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function ClientDashboard() {
  const {
    loading,
    syncing,
    error,
    profile,
    summary,
    displayName,
    todayMeals,
    weeklyMeals,
    mealStatuses,
    macro,
    toggleMealStatus,
    swapMeal,
    saveCompetitionDate,
    addCustomSupplement,
    refresh,
    forceRefreshIgnoringCache,
  } = useDashboardData();
  const [wakeTime, setWakeTime] = useState('');
  const [sleepTime, setSleepTime] = useState('');
  const [trainingTime, setTrainingTime] = useState(profile?.training_time || profile?.training_start_time || '');
  const [trainingEndTime, setTrainingEndTime] = useState(profile?.training_end_time || '');
  const [showAllDays, setShowAllDays] = useState(false);
  const [swapTarget, setSwapTarget] = useState(null);
  const [showCompetitionEditor, setShowCompetitionEditor] = useState(false);
  const [competitionDateDraft, setCompetitionDateDraft] = useState(formatDateInput(summary.competitionDate));
  const [supplementDraft, setSupplementDraft] = useState({ name: '', amount: '', notes: '' });

  const todayName = getTodayName();
  const currentDate = formatLongDate(new Date());
  const avatarInitials = buildInitials(displayName);
  const currentWeightText = formatWeight(summary.weight);
  const goalWeightText = formatWeight(summary.goalWeight);
  const caloriesTargetText = `${Math.round(summary.targetCalories || 0)} kcal`;
  const remainingKg = useMemo(() => {
    const w = Number(summary.weight);
    const g = Number(summary.goalWeight);
    if (!Number.isFinite(w) || !Number.isFinite(g)) return '0.0';
    return Math.abs(w - g).toFixed(1);
  }, [summary.weight, summary.goalWeight]);

  const customSupplements = useMemo(() => {
    const clientId = Number(profile?.id || profile?.display_id || 0);
    if (!clientId) return [];
    try {
      const raw = JSON.parse(localStorage.getItem('clientSupplements') || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.filter((row) => Number(row?.clientId) === Number(clientId));
    } catch {
      return [];
    }
  }, [profile?.id, profile?.display_id]);

  const profileSupplements = useMemo(() => {
    const fromArray = Array.isArray(profile?.supplements)
      ? profile.supplements.map((item) => ({
        name: String(item?.name || item?.supplement || '').trim(),
        amount: String(item?.amount || '').trim(),
        notes: String(item?.notes || '').trim(),
      }))
      : [];

    const fromText = typeof profile?.supplements === 'string'
      ? profile.supplements
        .split(/\n|;|,/) 
        .map((part) => ({ name: String(part || '').trim(), amount: '', notes: '' }))
      : [];

    return [...fromArray, ...fromText].filter((item) => item.name);
  }, [profile?.supplements]);

  const mergedSupplements = useMemo(() => {
    const all = [...profileSupplements, ...customSupplements];
    const seen = new Set();
    return all.filter((item) => {
      const key = `${String(item.name || '').toLowerCase()}|${String(item.amount || '').toLowerCase()}|${String(item.notes || '').toLowerCase()}`;
      if (!item.name || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [profileSupplements, customSupplements]);

  const swapOptions = useMemo(() => {
    if (!swapTarget?.mealKey) return [];
    const targetKey = normalizeMealCategory(swapTarget.mealKey);
    const options = [];
    Object.entries(weeklyMeals || {}).forEach(([dayName, meals]) => {
      (meals || []).forEach((meal) => {
        const mealKey = normalizeMealCategory(meal.mealKey || meal.mealLabel);
        if (mealKey === targetKey) {
          options.push({ dayName, meal });
        }
      });
    });
    return options;
  }, [swapTarget, weeklyMeals]);

  const competitionDaysLabel = useMemo(() => {
    const days = summary.daysUntilCompetition;
    if (days === null || days === undefined || Number.isNaN(days)) return 'N/A';
    return String(days);
  }, [summary.daysUntilCompetition]);

  const competitionHint = useMemo(() => {
    if (!summary.competitionDate) return 'No competition set';
    if (summary.daysUntilCompetition < 0) return 'Competition date is in the past';
    if (summary.daysUntilCompetition === 0) return 'Competition is today';
    return `${summary.daysUntilCompetition} day(s) remaining`;
  }, [summary.competitionDate, summary.daysUntilCompetition]);

  const handleSupplementAdd = async () => {
    const ok = await addCustomSupplement(supplementDraft);
    if (!ok) return;
    setSupplementDraft({ name: '', amount: '', notes: '' });
  };

  const handleCompetitionSave = async () => {
    const ok = await saveCompetitionDate(competitionDateDraft);
    if (ok) setShowCompetitionEditor(false);
  };

  const consultationLabel = useMemo(() => {
    const key = String(localStorage.getItem('subscriptionPlan') || localStorage.getItem('selectedPlan') || 'starter').toLowerCase();
    if (key === 'elite') return 'Elite';
    if (key === 'pro') return 'Pro';
    return 'Starter';
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientPortalNav activePath="/client-dashboard" isLoggedIn />
        <div className="py-8 text-center">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-800 font-sans leading-normal">
      <ClientPortalNav activePath="/client-dashboard" isLoggedIn />

      <section className="py-8 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-start gap-6 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, <span style={{ color: ACCENT }}>{displayName}</span>! 👋</h1>
              <p className="text-gray-600 mt-2">Here's your nutrition overview for today</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold" style={{ backgroundColor: ACCENT }}>{avatarInitials}</div>
                <Link to="/profile-setup?edit=1" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">✏️ Edit Full Profile</Link>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Today's Date</p>
              <p className="text-lg font-semibold">{currentDate}</p>
            </div>
          </div>
        </div>
      </section>

      {error && !/please login first/i.test(String(error)) ? (
        <div className="container mx-auto px-6 mt-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">{error}</div>
      ) : null}

      <section className="py-8">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="text-3xl">⚖️</div>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">On Track</span>
              </div>
              <h3 className="text-sm text-gray-500 mb-1">Current Weight</h3>
              <p className="text-3xl font-bold">{currentWeightText}</p>
              <p className="text-xs text-green-600 mt-2">No change this month</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="text-3xl">🔥</div>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Today</span>
              </div>
              <h3 className="text-sm text-gray-500 mb-1">Calories Target</h3>
              <p className="text-3xl font-bold">{caloriesTargetText}</p>
              <p className="text-xs text-gray-500 mt-2">{macro.consumed.calories} consumed / {Math.max((macro.target.calories || 0) - (macro.consumed.calories || 0), 0)} left</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="text-3xl">🎯</div>
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">Goal</span>
              </div>
              <h3 className="text-sm text-gray-500 mb-1">Target Weight</h3>
              <p className="text-3xl font-bold">{goalWeightText}</p>
              <p className="text-xs text-gray-500 mt-2">{remainingKg} kg remaining</p>
            </div>

            <div className="bg-red-50 p-6 rounded-2xl shadow-sm border-2 border-red-300 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="text-3xl">📅</div>
                <button
                  type="button"
                  className="text-xs px-2 py-1 bg-white border border-red-300 text-red-700 rounded hover:bg-red-100"
                  onClick={() => {
                    setCompetitionDateDraft(formatDateInput(summary.competitionDate));
                    setShowCompetitionEditor(true);
                  }}
                >
                  Edit
                </button>
              </div>
              <h3 className="text-sm text-red-700 font-semibold mb-1">Days Until Competition</h3>
              <p className="text-3xl font-bold text-red-600">{competitionDaysLabel}</p>
              <p className="text-xs text-red-600 mt-2">{competitionHint}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🕐</span>
                <h3 className="font-bold text-gray-900">Daily Schedule</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Wake-up Time</label>
                  <input type="time" className="w-full px-3 py-2 border rounded-lg text-sm" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Sleep Time</label>
                  <input type="time" className="w-full px-3 py-2 border rounded-lg text-sm" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} />
                </div>
                <button type="button" className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 text-sm" onClick={() => localStorage.setItem('clientDailySchedule', JSON.stringify({ wakeTime, sleepTime }))}>
                  Save Schedule
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">💪</span>
                <h3 className="font-bold text-gray-900">Training Time</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Exact Training Time</label>
                  <input type="time" className="w-full px-3 py-2 border rounded-lg text-sm" value={trainingTime} onChange={(e) => setTrainingTime(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Training End Time</label>
                  <input type="time" className="w-full px-3 py-2 border rounded-lg text-sm" value={trainingEndTime} onChange={(e) => setTrainingEndTime(e.target.value)} />
                </div>
                <p className="text-xs text-blue-600 font-semibold">Category: N/A</p>
                <p className="text-xs text-gray-500 italic">Meal order will adjust based on training time. Post-workout snack is set 30 minutes after training end time.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🩹</span>
                <h3 className="font-bold text-gray-900">Injury Mode</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">{profile?.injury_status ? profile?.injury_description || 'Injury mode active' : 'No injury reported'}</p>
              <button type="button" className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 text-sm">
                {profile?.injury_status ? 'Update Injury' : 'Report Injury'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-4">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">{todayName}'s Meal Plan</h2>
                  <div className="flex gap-3">
                    <button type="button" className="text-sm font-semibold hover:underline" style={{ color: ACCENT }} onClick={() => refresh()}>🔄 Refresh</button>
                    <button type="button" className="text-sm font-semibold hover:underline text-orange-600" title="Clear cached data and reload from server" onClick={() => forceRefreshIgnoringCache()}>🔄 Force Reload</button>
                    <button type="button" className="text-sm font-semibold hover:underline" style={{ color: ACCENT }} onClick={() => setShowAllDays(true)}>View All Days →</button>
                  </div>
                </div>

                {!todayMeals.length ? (
                  <p className="text-gray-500 text-center py-8">No meal plan assigned yet.</p>
                ) : (
                  <div className="space-y-4">
                    {todayMeals.map((meal) => {
                      const isComplete = mealStatuses[meal.mealId] === 'completed';
                      return (
                        <div key={meal.mealId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-blue-400 to-blue-600">🍽️</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-900">{meal.mealLabel}</h4>
                              <button
                                type="button"
                                className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                onClick={() => setSwapTarget({ mealId: meal.mealId, mealKey: meal.mealKey || meal.mealLabel, dayName: meal.dayName, mealIndex: meal.mealIndex })}
                              >
                                🔄 Swap
                              </button>
                            </div>
                            {meal.en ? <p className="text-sm text-gray-600">{meal.en}</p> : null}
                            {meal.ar ? <p className="text-sm text-gray-600 mt-1" style={{ direction: 'rtl', fontFamily: 'Cairo, Tahoma, sans-serif' }}>{meal.ar}</p> : null}
                            {meal.scheduledTime && meal.scheduledTime !== 'N/A' ? <p className="text-xs text-gray-500 mt-1"><strong>⏰ {meal.scheduledTime}</strong></p> : null}
                          </div>
                          <button
                            onClick={() => toggleMealStatus(meal.mealId)}
                            className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm ${isComplete ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-amber-400 border-amber-400 text-white'}`}
                          >
                            {isComplete ? 'Completed' : 'Not Completed'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Today's Macros</h3>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${macro.pendingMeals > 0 ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                    {macro.pendingMeals > 0 ? '⚠️ Not Completed' : '✅ Completed'}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4 text-center">
                  {macro.pendingMeals > 0 ? 'Meals are still not completed for today.' : 'Great work. All meals are completed for today.'}
                </p>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2"><span className="text-gray-600">Protein</span><span className="font-semibold">{macro.consumed.protein}g / {macro.target.protein}g</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min((macro.consumed.protein / Math.max(macro.target.protein, 1)) * 100, 100)}%` }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2"><span className="text-gray-600">Carbs</span><span className="font-semibold">{macro.consumed.carbs}g / {macro.target.carbs}g</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min((macro.consumed.carbs / Math.max(macro.target.carbs, 1)) * 100, 100)}%` }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2"><span className="text-gray-600">Fats</span><span className="font-semibold">{macro.consumed.fats}g / {macro.target.fats}g</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min((macro.consumed.fats / Math.max(macro.target.fats, 1)) * 100, 100)}%` }} /></div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-center">
                <p className="text-sm text-gray-600 mb-4">Need help or have questions?</p>
                <a href="/contact" className="block w-full text-white py-3 rounded-xl font-semibold hover:opacity-90 transition" style={{ backgroundColor: ACCENT }}>
                  💬 Message Your Doctor
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Supplements</h2>
            <p className="text-gray-600 mt-1">Integrated supplement guidance tied to your profile.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <p className="text-sm text-gray-700 mb-3">Taken supplements from your profile setup and add-client records:</p>
            {mergedSupplements.length ? (
              <ul className="space-y-2 mb-4">
                {mergedSupplements.map((row, index) => (
                  <li key={`${row.name || 'supp'}-${index}`} className="text-sm text-gray-700 border border-gray-100 rounded-lg px-3 py-2">
                    <strong>{row.name || 'Supplement'}</strong> {row.amount ? `- ${row.amount}g` : ''} {row.notes ? `(${row.notes})` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 mb-4">No supplements saved for this client yet.</p>
            )}
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              <input
                type="text"
                className="px-3 py-2 border rounded-lg text-sm"
                placeholder="Supplement name"
                value={supplementDraft.name}
                onChange={(event) => setSupplementDraft((prev) => ({ ...prev, name: event.target.value }))}
              />
              <input
                type="text"
                className="px-3 py-2 border rounded-lg text-sm"
                placeholder="Amount (grams)"
                value={supplementDraft.amount}
                onChange={(event) => setSupplementDraft((prev) => ({ ...prev, amount: event.target.value }))}
              />
              <input
                type="text"
                className="px-3 py-2 border rounded-lg text-sm"
                placeholder="Notes"
                value={supplementDraft.notes}
                onChange={(event) => setSupplementDraft((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </div>
            <button type="button" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 mr-3" onClick={handleSupplementAdd}>Save Supplement</button>
            <Link to="/supplements" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">+ Add Supplement</Link>
          </div>

          <div className="pt-2 mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Consultation</h2>
            <p className="text-gray-600 mt-1">Choose your consultation cadence and save it to your account.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-700 mb-4">Current selected plan: <strong>{consultationLabel}</strong></p>
            <Link to="/subscription-plan" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">+ Add Consultation</Link>
          </div>
        </div>
      </section>

      {showAllDays ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-5xl max-h-[85vh] overflow-auto rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Weekly Meals Overview</h3>
              <button type="button" className="px-3 py-1 border rounded-lg text-sm" onClick={() => setShowAllDays(false)}>Close</button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(weeklyMeals || {}).map(([dayName, meals]) => (
                <div key={dayName} className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold mb-2">{dayName}</h4>
                  {Array.isArray(meals) && meals.length ? (
                    <ul className="space-y-2 text-sm text-gray-700">
                      {meals.map((meal, index) => (
                        <li key={`${dayName}-${meal.mealLabel}-${index}`} className="bg-gray-50 rounded-lg px-3 py-2">
                          <strong>{meal.mealLabel}</strong>
                          <div>{meal.en || 'No meal text'}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No meals for this day.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {swapTarget ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl max-h-[80vh] overflow-auto rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Swap Meal</h3>
              <button type="button" className="px-3 py-1 border rounded-lg text-sm" onClick={() => setSwapTarget(null)}>Close</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Choose from all meals in the same category across all days.</p>
            <div className="space-y-2">
              {swapOptions.length ? (
                swapOptions.map(({ dayName, meal }, index) => (
                  <button
                    type="button"
                    key={`${dayName}-${meal.mealLabel}-${index}`}
                    className="w-full text-left border border-gray-200 hover:border-blue-300 rounded-lg p-3"
                    onClick={async () => {
                      await swapMeal({
                        dayName: swapTarget.dayName,
                        mealIndex: swapTarget.mealIndex,
                        replacementMeal: {
                          ...meal,
                          type: swapTarget.mealKey || meal.mealLabel,
                        },
                      });
                      setSwapTarget(null);
                    }}
                  >
                    <strong>{meal.mealLabel}</strong> <span className="text-xs text-gray-500">from {dayName}</span>
                    <div className="text-sm text-gray-700">{meal.en || 'No meal text'}</div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500">No alternatives found for this meal category.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {showCompetitionEditor ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-bold mb-3">Edit Competition Date</h3>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-lg text-sm mb-4"
              value={competitionDateDraft}
              onChange={(event) => setCompetitionDateDraft(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="px-3 py-2 border rounded-lg text-sm" onClick={() => setShowCompetitionEditor(false)}>Cancel</button>
              <button type="button" className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm" onClick={handleCompetitionSave}>Save</button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="py-6 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-6">
          <details className="text-xs text-gray-600 cursor-pointer">
            <summary className="font-semibold mb-2">🔍 Debug Profile Data</summary>
            <div className="grid md:grid-cols-2 gap-4 bg-white p-3 rounded-lg border border-gray-200 text-left">
              <div>
                <strong>Profile ID:</strong> {profile?.id || 'none'}<br />
                <strong>Display ID:</strong> {profile?.display_id || 'none'}<br />
                <strong>Full Name:</strong> {profile?.full_name || 'none'}<br />
                <strong>Weight:</strong> {profile?.weight || '0'}<br />
                <strong>Height:</strong> {profile?.height || '0'}<br />
                <strong>TDEE:</strong> {profile?.tdee || '0'}<br />
              </div>
              <div>
                <strong>Goal Weight:</strong> {profile?.goal_weight || '0'}<br />
                <strong>Protein Target:</strong> {profile?.protein_target || '0'}<br />
                <strong>Carbs Target:</strong> {profile?.carbs_target || '0'}<br />
                <strong>Fats Target:</strong> {profile?.fats_target || '0'}<br />
                <strong>Competition Date:</strong> {profile?.competition_date || 'N/A'}<br />
                <strong>Activity Level:</strong> {profile?.activity_level || 'N/A'}<br />
              </div>
            </div>
          </details>
        </div>
      </section>

      <footer className="py-8 text-center text-gray-500 text-sm border-t border-gray-200 bg-white">
        &copy; 2026 Client Nutrition Management. All rights reserved.
      </footer>
    </div>
  );
}

export default ClientDashboard;
