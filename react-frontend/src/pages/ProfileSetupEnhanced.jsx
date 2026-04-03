/**
 * ProfileSetupEnhanced.jsx
 * Enhanced profile setup component with full data persistence
 * Allows editing of:
 * - Basic info (name, email, phone, etc.)
 * - Profile data (weight, height, goal weight)
 * - Nutrition targets (protein, carbs, fats, calories)
 * - Competition date
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentClient, updateCurrentClient, updateClientProfile, updateClientNutrition } from '../utils/clientDataManager';
import ClientPortalNav from '../components/layout/ClientPortalNav';

const ACCENT = '#6eabf2';

function ProfileSetupEnhanced() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('basic'); // basic, profile, nutrition

  const [formData, setFormData] = useState({
    // Basic Info
    fullName: '',
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    country: '',
    sport: '',

    // Profile
    weight: '',
    height: '',
    goalWeight: '',
    bodyFatPercentage: '',
    skeletalMuscle: '',
    activityLevel: '',
    competitionDate: '',

    // Nutrition
    calories: '',
    proteinTarget: '',
    carbsTarget: '',
    fatsTarget: '',
    waterIntake: '',
  });

  // Load client data on mount
  useEffect(() => {
    try {
      const currentClient = getCurrentClient();
      if (!currentClient) {
        setError('No client logged in. Redirecting to login...');
        setTimeout(() => navigate('/client-login'), 2000);
        return;
      }

      setClient(currentClient);

      // Populate form with existing data
      setFormData({
        // Basic
        fullName: currentClient.fullName || '',
        email: currentClient.email || '',
        phone: currentClient.phone || '',
        firstName: currentClient.firstName || '',
        lastName: currentClient.lastName || '',
        country: currentClient.country || '',
        sport: currentClient.sport || '',

        // Profile
        weight: currentClient.profile?.weight || '',
        height: currentClient.profile?.height || '',
        goalWeight: currentClient.profile?.goalWeight || '',
        bodyFatPercentage: currentClient.profile?.bodyFatPercentage || '',
        skeletalMuscle: currentClient.profile?.skeletalMuscle || '',
        activityLevel: currentClient.profile?.activityLevel || '',
        competitionDate: currentClient.profile?.competitionDate || '',

        // Nutrition
        calories: currentClient.nutrition?.calories || '',
        proteinTarget: currentClient.nutrition?.proteinTarget || '',
        carbsTarget: currentClient.nutrition?.carbsTarget || '',
        fatsTarget: currentClient.nutrition?.fatsTarget || '',
        waterIntake: currentClient.nutrition?.waterIntake || '',
      });

      setError('');
    } catch (err) {
      console.error('Error loading client:', err);
      setError('Failed to load client data');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updates = {
        fullName: formData.fullName.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        country: formData.country.trim(),
        sport: formData.sport.trim(),
      };

      // Update profile
      const profileUpdates = {};
      if (formData.weight) profileUpdates.weight = Number(formData.weight);
      if (formData.height) profileUpdates.height = Number(formData.height);
      if (formData.goalWeight) profileUpdates.goalWeight = Number(formData.goalWeight);
      if (formData.bodyFatPercentage) profileUpdates.bodyFatPercentage = Number(formData.bodyFatPercentage);
      if (formData.skeletalMuscle) profileUpdates.skeletalMuscle = Number(formData.skeletalMuscle);
      if (formData.activityLevel) profileUpdates.activityLevel = formData.activityLevel;
      if (formData.competitionDate) profileUpdates.competitionDate = formData.competitionDate;

      // Update nutrition
      const nutritionUpdates = {};
      if (formData.calories) nutritionUpdates.calories = Number(formData.calories);
      if (formData.proteinTarget) nutritionUpdates.proteinTarget = Number(formData.proteinTarget);
      if (formData.carbsTarget) nutritionUpdates.carbsTarget = Number(formData.carbsTarget);
      if (formData.fatsTarget) nutritionUpdates.fatsTarget = Number(formData.fatsTarget);
      if (formData.waterIntake) nutritionUpdates.waterIntake = Number(formData.waterIntake);

      // Save all updates
      const updated = updateCurrentClient(updates);

      if (Object.keys(profileUpdates).length > 0) {
        updateClientProfile(profileUpdates);
      }

      if (Object.keys(nutritionUpdates).length > 0) {
        updateClientNutrition(nutritionUpdates);
      }

      if (updated) {
        setClient(updated);
        setSuccess('Profile saved successfully!');
        // Clear success after 2 seconds
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError('Failed to save profile');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientPortalNav activePath="/profile-setup" isLoggedIn />
        <div className="py-12 text-center">Loading profile...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientPortalNav activePath="/profile-setup" isLoggedIn />
        <div className="py-12 text-center">
          <p className="text-gray-600">{error || 'No client data found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientPortalNav activePath="/profile-setup" isLoggedIn />

      <section className="py-8 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Your Profile</h1>
          <p className="text-gray-600">Update your personal information and nutrition targets</p>
        </div>
      </section>

      {error && (
        <div className="container mx-auto px-6 mt-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="container mx-auto px-6 mt-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800">
            ✕
          </button>
        </div>
      )}

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-6 py-3 font-semibold border-b-2 transition ${
                activeTab === 'basic'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 font-semibold border-b-2 transition ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Profile Data
            </button>
            <button
              onClick={() => setActiveTab('nutrition')}
              className={`px-6 py-3 font-semibold border-b-2 transition ${
                activeTab === 'nutrition'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Nutrition Targets
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* BASIC INFO TAB */}
            {activeTab === 'basic' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold mb-6">Basic Information</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleFieldChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleFieldChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      placeholder="Doe"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleFieldChange('fullName', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      placeholder="+1234567890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => handleFieldChange('country', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      placeholder="Egypt"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sport</label>
                    <input
                      type="text"
                      value={formData.sport}
                      onChange={(e) => handleFieldChange('sport', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      placeholder="Swimming, Running, etc."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PROFILE DATA TAB */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold mb-6">Profile Data</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Current Weight (kg)</label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => handleFieldChange('weight', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      placeholder="75"
                      step="0.1"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Height (cm)</label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => handleFieldChange('height', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      placeholder="180"
                      step="0.1"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Goal Weight (kg)</label>
                    <input
                      type="number"
                      value={formData.goalWeight}
                      onChange={(e) => handleFieldChange('goalWeight', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      placeholder="70"
                      step="0.1"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Body Fat %</label>
                    <input
                      type="number"
                      value={formData.bodyFatPercentage}
                      onChange={(e) => handleFieldChange('bodyFatPercentage', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      placeholder="15"
                      step="0.1"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Skeletal Muscle %</label>
                    <input
                      type="number"
                      value={formData.skeletalMuscle}
                      onChange={(e) => handleFieldChange('skeletalMuscle', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      placeholder="40"
                      step="0.1"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Activity Level</label>
                    <select
                      value={formData.activityLevel}
                      onChange={(e) => handleFieldChange('activityLevel', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                    >
                      <option value="">Select activity level</option>
                      <option value="sedentary">Sedentary</option>
                      <option value="light">Light</option>
                      <option value="moderate">Moderate</option>
                      <option value="active">Active</option>
                      <option value="very-active">Very Active</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Competition Date</label>
                    <input
                      type="date"
                      value={formData.competitionDate}
                      onChange={(e) => handleFieldChange('competitionDate', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* NUTRITION TARGETS TAB */}
            {activeTab === 'nutrition' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold mb-6">Nutrition Targets</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Daily Calories (kcal)</label>
                    <input
                      type="number"
                      value={formData.calories}
                      onChange={(e) => handleFieldChange('calories', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      placeholder="2500"
                      step="10"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Protein Target (g)</label>
                    <input
                      type="number"
                      value={formData.proteinTarget}
                      onChange={(e) => handleFieldChange('proteinTarget', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      placeholder="150"
                      step="1"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Carbs Target (g)</label>
                    <input
                      type="number"
                      value={formData.carbsTarget}
                      onChange={(e) => handleFieldChange('carbsTarget', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      placeholder="300"
                      step="1"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Fats Target (g)</label>
                    <input
                      type="number"
                      value={formData.fatsTarget}
                      onChange={(e) => handleFieldChange('fatsTarget', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      placeholder="80"
                      step="1"
                      min="0"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Daily Water Intake (ml)</label>
                    <input
                      type="number"
                      value={formData.waterIntake}
                      onChange={(e) => handleFieldChange('waterIntake', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      placeholder="2000"
                      step="100"
                      min="0"
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Tip:</strong> These targets will be used to calculate your daily macro progress on the dashboard. Make sure they match your nutrition plan.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/client-dashboard')}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60 transition"
                style={{ backgroundColor: saving ? '#999' : ACCENT }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <footer className="py-8 text-center text-gray-500 text-sm border-t border-gray-200 bg-white">
        &copy; 2026 Client Nutrition Management. All rights reserved.
      </footer>
    </div>
  );
}

export default ProfileSetupEnhanced;
