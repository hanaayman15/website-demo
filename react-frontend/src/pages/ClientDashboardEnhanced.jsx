/**
 * ClientDashboardEnhanced.jsx
 * Enhanced dashboard component demonstrating full persistence system integration
 * Shows how to use:
 * - useDashboardClientData for client data
 * - useMealCompletion for meal tracking & macros
 * - useSupplementsManager for supplements
 */

import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useDashboardClientData } from '../hooks/useDashboardClientData';
import { useMealCompletion } from '../hooks/useMealCompletion';
import { useSupplementsManager } from '../hooks/useSupplementsManager';
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

function ClientDashboardEnhanced() {
  const navigate = useNavigate();
  const {
    client,
    profile,
    nutrition,
    meals,
    supplements,
    macros,
    daysUntilCompetition,
    loading,
    syncing,
    error,
    updateProfile,
    updateProfileField,
    refresh,
    clearError,
  } = useDashboardClientData();

  const {
    meals: trackedMeals,
    macros: trackedMacros,
    loading: mealsLoading,
    addMeal,
    toggleMealCompletion,
    removeMeal,
  } = useMealCompletion();

  const {
    supplements: userSupplements,
    addSupplement,
    removeSupplement,
    success: supplementSuccess,
    error: supplementError,
    clearError: clearSupplementError,
    clearSuccess: clearSupplementSuccess,
  } = useSupplementsManager();

  const [newMealForm, setNewMealForm] = useState({ name: '', protein: '', carbs: '', fats: '' });
  const [newSupplementForm, setNewSupplementForm] = useState({ name: '', amount: '', notes: '' });
  const [showMealForm, setShowMealForm] = useState(false);
  const [showSupplementForm, setShowSupplementForm] = useState(false);
  const [competitionDateDraft, setCompetitionDateDraft] = useState(profile?.competitionDate || '');
  const [showCompetitionEditor, setShowCompetitionEditor] = useState(false);

  const currentDate = formatLongDate(new Date());
  const avatarInitials = buildInitials(client?.fullName || 'Client');
  const currentWeightText = formatWeight(profile?.weight);
  const goalWeightText = formatWeight(profile?.goalWeight);
  const caloriesTargetText = `${Math.round(nutrition?.calories || 0)} kcal`;

  const remainingKg = useMemo(() => {
    const w = Number(profile?.weight);
    const g = Number(profile?.goalWeight);
    if (!Number.isFinite(w) || !Number.isFinite(g)) return '0.0';
    return Math.abs(w - g).toFixed(1);
  }, [profile?.weight, profile?.goalWeight]);

  const completionStats = useMemo(() => {
    const total = trackedMeals.length;
    const completed = trackedMeals.filter((m) => m.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percentage };
  }, [trackedMeals]);

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!newMealForm.name.trim()) return;

    const success = await addMeal(newMealForm);
    if (success) {
      setNewMealForm({ name: '', protein: '', carbs: '', fats: '' });
      setShowMealForm(false);
    }
  };

  const handleAddSupplement = async (e) => {
    e.preventDefault();
    if (!newSupplementForm.name.trim()) return;

    const success = await addSupplement(newSupplementForm);
    if (success) {
      setNewSupplementForm({ name: '', amount: '', notes: '' });
      setShowSupplementForm(false);
    }
  };

  const handleUpdateCompetitionDate = async () => {
    const success = await updateProfileField('competitionDate', competitionDateDraft);
    if (success) {
      setShowCompetitionEditor(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientPortalNav activePath="/client-dashboard" isLoggedIn />
        <div className="py-8 text-center">Loading dashboard...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientPortalNav activePath="/client-dashboard" isLoggedIn />
        <div className="py-12 text-center">
          <p className="text-gray-600 mb-4">No client logged in. Redirecting to login...</p>
          {setTimeout(() => navigate('/client-login'), 2000)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-800 font-sans leading-normal">
      <ClientPortalNav activePath="/client-dashboard" isLoggedIn />

      {/* Header Section */}
      <section className="py-8 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-start gap-6 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, <span style={{ color: ACCENT }}>{client?.fullName || 'Client'}</span>! 👋
              </h1>
              <p className="text-gray-600 mt-2">Here's your nutrition overview for today</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold" style={{ backgroundColor: ACCENT }}>
                  {avatarInitials}
                </div>
                <Link
                  to="/profile-setup?edit=1"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  ✏️ Edit Full Profile
                </Link>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Today's Date</p>
              <p className="text-lg font-semibold">{currentDate}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Errors */}
      {error && (
        <div className="container mx-auto px-6 mt-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-600 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {supplementError && (
        <div className="container mx-auto px-6 mt-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 flex justify-between items-center">
          <span>{supplementError}</span>
          <button onClick={clearSupplementError} className="text-red-600 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {supplementSuccess && (
        <div className="container mx-auto px-6 mt-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 flex justify-between items-center">
          <span>{supplementSuccess}</span>
          <button onClick={clearSupplementSuccess} className="text-green-600 hover:text-green-800">
            ✕
          </button>
        </div>
      )}

      {/* Dashboard Cards */}
      <section className="py-8">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-6">
            {/* Current Weight */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="text-3xl">⚖️</div>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">On Track</span>
              </div>
              <h3 className="text-sm text-gray-500 mb-1">Current Weight</h3>
              <p className="text-3xl font-bold">{currentWeightText}</p>
              <p className="text-xs text-green-600 mt-2">No change this month</p>
            </div>

            {/* Calories Target */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="text-3xl">🔥</div>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Today</span>
              </div>
              <h3 className="text-sm text-gray-500 mb-1">Calories Target</h3>
              <p className="text-3xl font-bold">{caloriesTargetText}</p>
            </div>

            {/* Target Weight */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="text-3xl">🎯</div>
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">Goal</span>
              </div>
              <h3 className="text-sm text-gray-500 mb-1">Target Weight</h3>
              <p className="text-3xl font-bold">{goalWeightText}</p>
              <p className="text-xs text-gray-500 mt-2">{remainingKg} kg remaining</p>
            </div>

            {/* Competition Date */}
            <div className="bg-red-50 p-6 rounded-2xl shadow-sm border-2 border-red-300 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="text-3xl">📅</div>
                <button
                  onClick={() => {
                    setCompetitionDateDraft(profile?.competitionDate || '');
                    setShowCompetitionEditor(true);
                  }}
                  className="text-xs px-2 py-1 bg-white border border-red-300 text-red-700 rounded hover:bg-red-100"
                >
                  Edit
                </button>
              </div>
              <h3 className="text-sm text-red-700 font-semibold mb-1">Days Until Competition</h3>
              <p className="text-3xl font-bold text-red-600">
                {daysUntilCompetition !== null ? daysUntilCompetition : 'N/A'}
              </p>
              <p className="text-xs text-red-600 mt-2">
                {profile?.competitionDate
                  ? daysUntilCompetition < 0
                    ? 'Competition date is in the past'
                    : daysUntilCompetition === 0
                      ? 'Competition is today'
                      : `${daysUntilCompetition} day(s) remaining`
                  : 'No competition set'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Meals & Macros Section */}
      <section className="py-8">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Meals */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Today's Meals</h2>
                  <button
                    onClick={() => setShowMealForm(!showMealForm)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                  >
                    + Add Meal
                  </button>
                </div>

                {/* Add Meal Form */}
                {showMealForm && (
                  <form onSubmit={handleAddMeal} className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold mb-3">Add New Meal</h4>
                    <div className="grid md:grid-cols-4 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Meal name *"
                        value={newMealForm.name}
                        onChange={(e) => setNewMealForm({ ...newMealForm, name: e.target.value })}
                        className="px-3 py-2 border rounded-lg text-sm"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Protein (g)"
                        value={newMealForm.protein}
                        onChange={(e) => setNewMealForm({ ...newMealForm, protein: e.target.value })}
                        className="px-3 py-2 border rounded-lg text-sm"
                        min="0"
                      />
                      <input
                        type="number"
                        placeholder="Carbs (g)"
                        value={newMealForm.carbs}
                        onChange={(e) => setNewMealForm({ ...newMealForm, carbs: e.target.value })}
                        className="px-3 py-2 border rounded-lg text-sm"
                        min="0"
                      />
                      <input
                        type="number"
                        placeholder="Fats (g)"
                        value={newMealForm.fats}
                        onChange={(e) => setNewMealForm({ ...newMealForm, fats: e.target.value })}
                        className="px-3 py-2 border rounded-lg text-sm"
                        min="0"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
                        Save Meal
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMealForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Meals List */}
                {trackedMeals.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No meals added yet. Click "Add Meal" to get started!</p>
                ) : (
                  <div className="space-y-3">
                    {trackedMeals.map((meal, index) => (
                      <div key={index} className={`flex items-center gap-4 p-4 rounded-xl border-2 ${meal.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <input
                          type="checkbox"
                          checked={meal.completed}
                          onChange={() => toggleMealCompletion(index)}
                          className="w-5 h-5 rounded cursor-pointer"
                        />
                        <div className="flex-1">
                          <h4 className={`font-bold ${meal.completed ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                            {meal.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fats}g
                          </p>
                        </div>
                        <button
                          onClick={() => removeMeal(index)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Today's Macros */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Today's Macros</h3>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${completionStats.completed === completionStats.total ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {completionStats.completed === completionStats.total && completionStats.total > 0
                      ? '✅ Completed'
                      : '⚠️ In Progress'}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 text-center">
                  {completionStats.completed === completionStats.total && completionStats.total > 0
                    ? '✅ Great work. All meals are completed for today.'
                    : `${completionStats.completed} of ${completionStats.total} meals completed`}
                </p>

                <div className="space-y-4">
                  {/* Completion Progress */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2">
                      <span className="text-gray-700">Meal Progress</span>
                      <span className="text-gray-900">{completionStats.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${completionStats.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Protein */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Protein</span>
                      <span className="font-semibold">
                        {trackedMacros.totalProtein}g / {nutrition?.proteinTarget || 0}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min((trackedMacros.totalProtein / Math.max(nutrition?.proteinTarget || 1, 1)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Carbs */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Carbs</span>
                      <span className="font-semibold">
                        {trackedMacros.totalCarbs}g / {nutrition?.carbsTarget || 0}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min((trackedMacros.totalCarbs / Math.max(nutrition?.carbsTarget || 1, 1)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Fats */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Fats</span>
                      <span className="font-semibold">
                        {trackedMacros.totalFats}g / {nutrition?.fatsTarget || 0}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min((trackedMacros.totalFats / Math.max(nutrition?.fatsTarget || 1, 1)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Consultation CTA */}
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-center">
                <p className="text-sm text-gray-600 mb-4">Need help with nutrition planning?</p>
                <a
                  href="/contact"
                  className="block w-full text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
                  style={{ backgroundColor: ACCENT }}
                >
                  💬 Message Your Nutritionist
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supplements Section */}
      <section className="py-10">
        <div className="container mx-auto px-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Supplements</h2>
            <p className="text-gray-600 mt-1">Manage your daily supplement intake</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Your Supplements</h3>
              <button
                onClick={() => setShowSupplementForm(!showSupplementForm)}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
              >
                + Add Supplement
              </button>
            </div>

            {/* Add Supplement Form */}
            {showSupplementForm && (
              <form onSubmit={handleAddSupplement} className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <h4 className="font-semibold mb-3">Add New Supplement</h4>
                <div className="grid md:grid-cols-3 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Supplement name *"
                    value={newSupplementForm.name}
                    onChange={(e) => setNewSupplementForm({ ...newSupplementForm, name: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Amount (e.g., 500mg)"
                    value={newSupplementForm.amount}
                    onChange={(e) => setNewSupplementForm({ ...newSupplementForm, amount: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Notes"
                    value={newSupplementForm.notes}
                    onChange={(e) => setNewSupplementForm({ ...newSupplementForm, notes: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700">
                    Save Supplement
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSupplementForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Supplements List */}
            {userSupplements.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No supplements added yet. Click "Add Supplement" to get started!</p>
            ) : (
              <div className="space-y-2">
                {userSupplements.map((supplement, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{supplement.name}</h4>
                      <p className="text-sm text-gray-600">
                        {supplement.amount && `${supplement.amount}`}
                        {supplement.amount && supplement.notes && ' • '}
                        {supplement.notes && supplement.notes}
                      </p>
                    </div>
                    <button
                      onClick={() => removeSupplement(index)}
                      className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Competition Date Modal */}
      {showCompetitionEditor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-bold mb-4">Set Competition Date</h3>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-lg text-sm mb-4"
              value={competitionDateDraft}
              onChange={(e) => setCompetitionDateDraft(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCompetitionEditor(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCompetitionDate}
                disabled={syncing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {syncing ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-8 text-center text-gray-500 text-sm border-t border-gray-200 bg-white">
        &copy; 2026 Client Nutrition Management. All rights reserved.
      </footer>
    </div>
  );
}

export default ClientDashboardEnhanced;
