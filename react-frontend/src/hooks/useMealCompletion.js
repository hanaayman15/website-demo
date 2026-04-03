/**
 * useMealCompletion Hook
 * Manages meal completion tracking and macro calculations with localStorage persistence
 */

import { useState, useCallback, useEffect } from 'react';
import {
  getCurrentClient,
  updateCurrentClient,
  calculateMacros,
} from '../utils/clientDataManager';

export function useMealCompletion() {
  const [meals, setMeals] = useState([]);
  const [macros, setMacros] = useState({
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load meals from current client on mount
  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = useCallback(() => {
    try {
      const client = getCurrentClient();
      if (!client) {
        setMeals([]);
        setLoading(false);
        return;
      }

      const clientMeals = Array.isArray(client.meals) ? client.meals : [];
      setMeals(clientMeals);
      
      // Calculate macros from current meals
      const calculated = calculateMacros(clientMeals);
      setMacros(calculated);
      setError('');
    } catch (err) {
      console.error('Error loading meals:', err);
      setError('Failed to load meals');
      setMeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add meal
  const addMeal = useCallback(
    async (meal) => {
      try {
        if (!meal.name || !meal.name.trim()) {
          setError('Meal name is required');
          return false;
        }

        const client = getCurrentClient();
        if (!client) {
          setError('Client not found');
          return false;
        }

        const newMeals = Array.isArray(client.meals) ? [...client.meals] : [];
        newMeals.push({
          name: meal.name.trim(),
          protein: Math.max(Number(meal.protein) || 0, 0),
          carbs: Math.max(Number(meal.carbs) || 0, 0),
          fats: Math.max(Number(meal.fats) || 0, 0),
          completed: false,
        });

        const updated = updateCurrentClient({ meals: newMeals });
        if (updated) {
          setMeals(newMeals);
          const calculated = calculateMacros(newMeals);
          setMacros(calculated);
          setSuccess(`Added ${meal.name}`);
          setError('');
          // Clear success message after 2 seconds
          setTimeout(() => setSuccess(''), 2000);
          return true;
        }
        setError('Failed to add meal');
        return false;
      } catch (err) {
        console.error('Error adding meal:', err);
        setError('Failed to add meal');
        return false;
      }
    },
    []
  );

  // Toggle meal completion
  const toggleMealCompletion = useCallback(
    async (index) => {
      try {
        const client = getCurrentClient();
        if (!client) {
          setError('Client not found');
          return false;
        }

        const newMeals = Array.isArray(client.meals) ? [...client.meals] : [];
        if (newMeals[index]) {
          newMeals[index] = {
            ...newMeals[index],
            completed: !newMeals[index].completed,
          };

          const updated = updateCurrentClient({ meals: newMeals });
          if (updated) {
            setMeals(newMeals);
            const calculated = calculateMacros(newMeals);
            setMacros(calculated);
            
            const mealName = newMeals[index].name;
            const status = newMeals[index].completed ? 'completed' : 'uncompleted';
            setSuccess(`${mealName} marked as ${status}`);
            setError('');
            // Clear success message after 2 seconds
            setTimeout(() => setSuccess(''), 2000);
            return true;
          }
        }
        setError('Failed to update meal');
        return false;
      } catch (err) {
        console.error('Error toggling meal completion:', err);
        setError('Failed to update meal');
        return false;
      }
    },
    []
  );

  // Remove meal
  const removeMeal = useCallback(
    async (index) => {
      try {
        const client = getCurrentClient();
        if (!client) {
          setError('Client not found');
          return false;
        }

        const mealName = meals[index]?.name || 'meal';
        const newMeals = Array.isArray(client.meals) ? [...client.meals] : [];
        newMeals.splice(index, 1);

        const updated = updateCurrentClient({ meals: newMeals });
        if (updated) {
          setMeals(newMeals);
          const calculated = calculateMacros(newMeals);
          setMacros(calculated);
          setSuccess(`Removed ${mealName}`);
          setError('');
          // Clear success message after 2 seconds
          setTimeout(() => setSuccess(''), 2000);
          return true;
        }
        setError('Failed to remove meal');
        return false;
      } catch (err) {
        console.error('Error removing meal:', err);
        setError('Failed to remove meal');
        return false;
      }
    },
    [meals]
  );

  // Update meal
  const updateMeal = useCallback(
    async (index, updatedMeal) => {
      try {
        const client = getCurrentClient();
        if (!client) {
          setError('Client not found');
          return false;
        }

        if (!updatedMeal.name || !updatedMeal.name.trim()) {
          setError('Meal name is required');
          return false;
        }

        const newMeals = Array.isArray(client.meals) ? [...client.meals] : [];
        if (newMeals[index]) {
          newMeals[index] = {
            name: updatedMeal.name.trim(),
            protein: Math.max(Number(updatedMeal.protein) || 0, 0),
            carbs: Math.max(Number(updatedMeal.carbs) || 0, 0),
            fats: Math.max(Number(updatedMeal.fats) || 0, 0),
            completed: updatedMeal.completed || false,
          };

          const updated = updateCurrentClient({ meals: newMeals });
          if (updated) {
            setMeals(newMeals);
            const calculated = calculateMacros(newMeals);
            setMacros(calculated);
            setSuccess('Meal updated');
            setError('');
            // Clear success message after 2 seconds
            setTimeout(() => setSuccess(''), 2000);
            return true;
          }
        }
        setError('Failed to update meal');
        return false;
      } catch (err) {
        console.error('Error updating meal:', err);
        setError('Failed to update meal');
        return false;
      }
    },
    []
  );

  // Mark all as complete
  const completeAllMeals = useCallback(async () => {
    try {
      const client = getCurrentClient();
      if (!client) {
        setError('Client not found');
        return false;
      }

      const newMeals = Array.isArray(client.meals)
        ? client.meals.map((m) => ({ ...m, completed: true }))
        : [];

      const updated = updateCurrentClient({ meals: newMeals });
      if (updated) {
        setMeals(newMeals);
        const calculated = calculateMacros(newMeals);
        setMacros(calculated);
        setSuccess('All meals marked as completed');
        setError('');
        // Clear success message after 2 seconds
        setTimeout(() => setSuccess(''), 2000);
        return true;
      }
      setError('Failed to complete all meals');
      return false;
    } catch (err) {
      console.error('Error completing all meals:', err);
      setError('Failed to complete all meals');
      return false;
    }
  }, []);

  // Reset all meals (mark as incomplete)
  const resetAllMeals = useCallback(async () => {
    try {
      const client = getCurrentClient();
      if (!client) {
        setError('Client not found');
        return false;
      }

      const newMeals = Array.isArray(client.meals)
        ? client.meals.map((m) => ({ ...m, completed: false }))
        : [];

      const updated = updateCurrentClient({ meals: newMeals });
      if (updated) {
        setMeals(newMeals);
        const calculated = calculateMacros(newMeals);
        setMacros(calculated);
        setSuccess('All meals reset');
        setError('');
        // Clear success message after 2 seconds
        setTimeout(() => setSuccess(''), 2000);
        return true;
      }
      setError('Failed to reset meals');
      return false;
    } catch (err) {
      console.error('Error resetting meals:', err);
      setError('Failed to reset meals');
      return false;
    }
  }, []);

  // Get completion stats
  const getCompletionStats = useCallback(() => {
    const total = meals.length;
    const completed = meals.filter((m) => m.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percentage };
  }, [meals]);

  // Refresh from storage
  const refresh = useCallback(() => {
    loadMeals();
  }, [loadMeals]);

  // Clear error
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Clear success
  const clearSuccess = useCallback(() => {
    setSuccess('');
  }, []);

  return {
    meals,
    macros,
    loading,
    error,
    success,
    addMeal,
    toggleMealCompletion,
    removeMeal,
    updateMeal,
    completeAllMeals,
    resetAllMeals,
    getCompletionStats,
    refresh,
    clearError,
    clearSuccess,
  };
}
