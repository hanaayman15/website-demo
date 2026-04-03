/**
 * useSupplementsManager Hook
 * Manages supplements for the current client with automatic localStorage persistence
 * This hook is dedicated to the localStorage-based persistence system
 */

import { useState, useCallback, useEffect } from 'react';
import {
  getCurrentClient,
  addSupplementToCurrentClient,
  removeSupplementFromCurrentClient,
  updateCurrentClient,
} from '../utils/clientDataManager';

export function useSupplementsManager() {
  const [supplements, setSupplements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load supplements from current client on mount
  useEffect(() => {
    loadSupplements();
  }, []);

  const loadSupplements = useCallback(() => {
    try {
      const client = getCurrentClient();
      if (!client) {
        setSupplements([]);
        setLoading(false);
        return;
      }

      const clientSupplements = Array.isArray(client.supplements) ? client.supplements : [];
      setSupplements(clientSupplements);
      setError('');
    } catch (err) {
      console.error('Error loading supplements:', err);
      setError('Failed to load supplements');
      setSupplements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add supplement
  const addSupplement = useCallback(
    async (supplement) => {
      try {
        if (!supplement.name || !supplement.name.trim()) {
          setError('Supplement name is required');
          return false;
        }

        const updated = addSupplementToCurrentClient({
          name: supplement.name.trim(),
          amount: supplement.amount ? String(supplement.amount).trim() : '',
          notes: supplement.notes ? String(supplement.notes).trim() : '',
        });

        if (updated) {
          const newSupplements = Array.isArray(updated.supplements) ? updated.supplements : [];
          setSupplements(newSupplements);
          setSuccess(`Added ${supplement.name}`);
          setError('');
          // Clear success message after 2 seconds
          setTimeout(() => setSuccess(''), 2000);
          return true;
        }
        setError('Failed to add supplement');
        return false;
      } catch (err) {
        console.error('Error adding supplement:', err);
        setError('Failed to add supplement');
        return false;
      }
    },
    []
  );

  // Remove supplement by index
  const removeSupplement = useCallback(
    async (index) => {
      try {
        const name = supplements[index]?.name || 'supplement';
        const updated = removeSupplementFromCurrentClient(index);
        if (updated) {
          const newSupplements = Array.isArray(updated.supplements) ? updated.supplements : [];
          setSupplements(newSupplements);
          setSuccess(`Removed ${name}`);
          setError('');
          // Clear success message after 2 seconds
          setTimeout(() => setSuccess(''), 2000);
          return true;
        }
        setError('Failed to remove supplement');
        return false;
      } catch (err) {
        console.error('Error removing supplement:', err);
        setError('Failed to remove supplement');
        return false;
      }
    },
    [supplements]
  );

  // Update supplement by index
  const updateSupplement = useCallback(
    async (index, updatedSupplement) => {
      try {
        const client = getCurrentClient();
        if (!client) {
          setError('Client not found');
          return false;
        }

        if (!updatedSupplement.name || !updatedSupplement.name.trim()) {
          setError('Supplement name is required');
          return false;
        }

        const newSupplements = Array.isArray(client.supplements) ? [...client.supplements] : [];
        if (newSupplements[index]) {
          newSupplements[index] = {
            name: updatedSupplement.name.trim(),
            amount: updatedSupplement.amount ? String(updatedSupplement.amount).trim() : '',
            notes: updatedSupplement.notes ? String(updatedSupplement.notes).trim() : '',
          };
          const updated = updateCurrentClient({ supplements: newSupplements });
          if (updated) {
            setSupplements(newSupplements);
            setSuccess('Supplement updated');
            setError('');
            // Clear success message after 2 seconds
            setTimeout(() => setSuccess(''), 2000);
            return true;
          }
        }
        setError('Failed to update supplement');
        return false;
      } catch (err) {
        console.error('Error updating supplement:', err);
        setError('Failed to update supplement');
        return false;
      }
    },
    []
  );

  // Clear all supplements
  const clearAllSupplements = useCallback(async () => {
    try {
      const updated = updateCurrentClient({ supplements: [] });
      if (updated) {
        setSupplements([]);
        setSuccess('All supplements cleared');
        setError('');
        // Clear success message after 2 seconds
        setTimeout(() => setSuccess(''), 2000);
        return true;
      }
      setError('Failed to clear supplements');
      return false;
    } catch (err) {
      console.error('Error clearing supplements:', err);
      setError('Failed to clear supplements');
      return false;
    }
  }, []);

  // Refresh from storage
  const refresh = useCallback(() => {
    loadSupplements();
  }, [loadSupplements]);

  // Clear error message
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Clear success message
  const clearSuccess = useCallback(() => {
    setSuccess('');
  }, []);

  return {
    supplements,
    loading,
    error,
    success,
    addSupplement,
    removeSupplement,
    updateSupplement,
    clearAllSupplements,
    refresh,
    clearError,
    clearSuccess,
  };
}
