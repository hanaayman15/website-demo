/**
 * useDashboardClientData Hook
 * Comprehensive hook for managing all client dashboard data with localStorage persistence
 */

import { useState, useCallback, useEffect } from 'react';
import {
  getCurrentClient,
  updateCurrentClient,
  updateClientProfile,
  updateClientNutrition,
  calculateDaysLeft,
  calculateMacros,
} from '../utils/clientDataManager';

export function useDashboardClientData() {
  const [client, setClient] = useState(null);
  const [profile, setProfile] = useState({});
  const [nutrition, setNutrition] = useState({});
  const [meals, setMeals] = useState([]);
  const [supplements, setSupplements] = useState([]);
  const [macros, setMacros] = useState({
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
  });
  const [daysUntilCompetition, setDaysUntilCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Load all client data on mount
  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = useCallback(() => {
    try {
      const currentClient = getCurrentClient();
      if (!currentClient) {
        setError('No client logged in');
        setClient(null);
        setLoading(false);
        return;
      }

      setClient(currentClient);
      setProfile(currentClient.profile || {});
      setNutrition(currentClient.nutrition || {});
      
      const clientMeals = Array.isArray(currentClient.meals) ? currentClient.meals : [];
      setMeals(clientMeals);

      const calculated = calculateMacros(clientMeals);
      setMacros(calculated);

      const clientSupplements = Array.isArray(currentClient.supplements) ? currentClient.supplements : [];
      setSupplements(clientSupplements);

      const days = calculateDaysLeft(currentClient.profile?.competitionDate);
      setDaysUntilCompetition(days);

      setError('');
    } catch (err) {
      console.error('Error loading client data:', err);
      setError('Failed to load client data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update profile data
  const updateProfile = useCallback(
    async (profileData) => {
      try {
        setSyncing(true);
        const updated = updateClientProfile(profileData);
        if (updated) {
          setClient(updated);
          setProfile(updated.profile || {});
          
          // Recalculate days if competition date changed
          if (profileData.competitionDate) {
            const days = calculateDaysLeft(profileData.competitionDate);
            setDaysUntilCompetition(days);
          }
          
          return true;
        }
        setError('Failed to update profile');
        return false;
      } catch (err) {
        console.error('Error updating profile:', err);
        setError('Failed to update profile');
        return false;
      } finally {
        setSyncing(false);
      }
    },
    []
  );

  // Update nutrition data
  const updateNutrition = useCallback(
    async (nutritionData) => {
      try {
        setSyncing(true);
        const updated = updateClientNutrition(nutritionData);
        if (updated) {
          setClient(updated);
          setNutrition(updated.nutrition || {});
          return true;
        }
        setError('Failed to update nutrition');
        return false;
      } catch (err) {
        console.error('Error updating nutrition:', err);
        setError('Failed to update nutrition');
        return false;
      } finally {
        setSyncing(false);
      }
    },
    []
  );

  // Update full client data
  const updateFullProfile = useCallback(
    async (updates) => {
      try {
        setSyncing(true);
        const updated = updateCurrentClient(updates);
        if (updated) {
          setClient(updated);
          setProfile(updated.profile || {});
          setNutrition(updated.nutrition || {});
          
          const clientMeals = Array.isArray(updated.meals) ? updated.meals : [];
          setMeals(clientMeals);
          const calculated = calculateMacros(clientMeals);
          setMacros(calculated);

          const clientSupplements = Array.isArray(updated.supplements) ? updated.supplements : [];
          setSupplements(clientSupplements);

          if (updated.profile?.competitionDate) {
            const days = calculateDaysLeft(updated.profile.competitionDate);
            setDaysUntilCompetition(days);
          }

          return true;
        }
        setError('Failed to update client data');
        return false;
      } catch (err) {
        console.error('Error updating client data:', err);
        setError('Failed to update client data');
        return false;
      } finally {
        setSyncing(false);
      }
    },
    []
  );

  // Update single profile field
  const updateProfileField = useCallback(
    async (field, value) => {
      try {
        setSyncing(true);
        const updated = updateProfile({ [field]: value });
        return updated;
      } catch (err) {
        console.error(`Error updating profile field ${field}:`, err);
        return false;
      }
    },
    [updateProfile]
  );

  // Update single nutrition field
  const updateNutritionField = useCallback(
    async (field, value) => {
      try {
        setSyncing(true);
        const updated = updateNutrition({ [field]: value });
        return updated;
      } catch (err) {
        console.error(`Error updating nutrition field ${field}:`, err);
        return false;
      }
    },
    [updateNutrition]
  );

  // Get progress stats
  const getProgressStats = useCallback(() => {
    const current = profile?.weight || 0;
    const goal = profile?.goalWeight || 0;
    const remaining = Math.abs(Number(current) - Number(goal));
    const completionPercentage = goal > 0 ? Math.round(((Number(current) - Number(goal)) / goal) * 100) : 0;

    const mealStats = {
      total: meals.length,
      completed: meals.filter((m) => m.completed).length,
    };
    mealStats.percentage = mealStats.total === 0 ? 0 : Math.round((mealStats.completed / mealStats.total) * 100);

    return {
      weight: {
        current,
        goal,
        remaining,
        completionPercentage,
      },
      meals: mealStats,
      macros,
      daysUntilCompetition,
    };
  }, [profile, macros, meals, daysUntilCompetition]);

  // Refresh all data
  const refresh = useCallback(() => {
    loadClientData();
  }, [loadClientData]);

  // Clear error
  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
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
    updateNutrition,
    updateFullProfile,
    updateProfileField,
    updateNutritionField,
    getProgressStats,
    refresh,
    clearError,
  };
}
