/**
 * Client Data Manager - Centralized localStorage management for client data
 * Handles all client CRUD operations with localStorage
 */

const CLIENTS_KEY = 'clients';
const CURRENT_CLIENT_KEY = 'currentClient';

/**
 * Get current logged-in client
 * @returns {object|null} Current client object or null if not logged in
 */
export function getCurrentClient() {
  try {
    const raw = localStorage.getItem(CURRENT_CLIENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Error reading current client:', error);
    return null;
  }
}

/**
 * Set current logged-in client
 * @param {object} client - Client object to set as current
 */
export function setCurrentClient(client) {
  try {
    if (!client) {
      localStorage.removeItem(CURRENT_CLIENT_KEY);
      return;
    }
    localStorage.setItem(CURRENT_CLIENT_KEY, JSON.stringify(client));
  } catch (error) {
    console.error('Error setting current client:', error);
  }
}

/**
 * Clear current client (logout)
 */
export function clearCurrentClient() {
  try {
    localStorage.removeItem(CURRENT_CLIENT_KEY);
  } catch (error) {
    console.error('Error clearing current client:', error);
  }
}

/**
 * Get all clients from storage
 * @returns {array} Array of client objects
 */
export function getAllClients() {
  try {
    const raw = localStorage.getItem(CLIENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Error reading all clients:', error);
    return [];
  }
}

/**
 * Save all clients to storage
 * @param {array} clients - Array of client objects
 */
export function saveAllClients(clients) {
  try {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  } catch (error) {
    console.error('Error saving all clients:', error);
  }
}

/**
 * Create a new client with default data structure
 * @param {object} signupData - Data from signup form
 * @returns {object} New client object
 */
export function createNewClient(signupData = {}) {
  const id = Math.random().toString(36).substr(2, 9);
  const now = new Date().toISOString();

  return {
    id,
    email: signupData.email || '',
    password: signupData.password || '',
    fullName: signupData.fullName || signupData.name || '',
    firstName: signupData.firstName || '',
    lastName: signupData.lastName || '',
    phone: signupData.phone || '',
    country: signupData.country || '',
    sport: signupData.sport || '',
    createdAt: now,
    updatedAt: now,
    profile: {
      weight: null,
      height: null,
      goalWeight: null,
      bodyFatPercentage: null,
      skeletalMuscle: null,
      activityLevel: '',
      competitionDate: null,
    },
    nutrition: {
      calories: null,
      proteinTarget: null,
      carbsTarget: null,
      fatsTarget: null,
      waterIntake: null,
    },
    supplements: [
      // { name, amount, notes }
    ],
    meals: [
      // { name, protein, carbs, fats, completed: false }
    ],
    progress: {
      dailyMeals: {}, // { date: [meals] }
      mealCompletionStatus: {}, // { date: [{ index, completed }] }
      macrosHistory: [], // { date, protein, carbs, fats }
    },
  };
}

/**
 * Add or update a client in storage
 * @param {object} client - Client object
 * @returns {object} Updated client
 */
export function addOrUpdateClient(client) {
  try {
    const clients = getAllClients();
    const existingIndex = clients.findIndex((c) => c.id === client.id);

    const updatedClient = {
      ...client,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      clients[existingIndex] = updatedClient;
    } else {
      clients.push(updatedClient);
    }

    saveAllClients(clients);
    return updatedClient;
  } catch (error) {
    console.error('Error adding/updating client:', error);
    return client;
  }
}

/**
 * Find client by email and password
 * @param {string} email - Client email
 * @param {string} password - Client password
 * @returns {object|null} Client object or null if not found
 */
export function findClientByEmailAndPassword(email, password) {
  try {
    const clients = getAllClients();
    const normalized = String(email || '').trim().toLowerCase();
    return clients.find(
      (c) => String(c.email || '').trim().toLowerCase() === normalized && c.password === password
    ) || null;
  } catch (error) {
    console.error('Error finding client:', error);
    return null;
  }
}

/**
 * Find client by email only
 * @param {string} email - Client email
 * @returns {object|null} Client object or null if not found
 */
export function findClientByEmail(email) {
  try {
    const clients = getAllClients();
    const normalized = String(email || '').trim().toLowerCase();
    return clients.find(
      (c) => String(c.email || '').trim().toLowerCase() === normalized
    ) || null;
  } catch (error) {
    console.error('Error finding client by email:', error);
    return null;
  }
}

/**
 * Update current client's data
 * @param {object} updatedData - Data to update
 * @returns {object|null} Updated client or null
 */
export function updateCurrentClient(updatedData = {}) {
  try {
    const current = getCurrentClient();
    if (!current) return null;

    const updated = {
      ...current,
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };

    setCurrentClient(updated);
    addOrUpdateClient(updated);
    return updated;
  } catch (error) {
    console.error('Error updating current client:', error);
    return null;
  }
}

/**
 * Add supplement to current client
 * @param {object} supplement - Supplement object { name, amount, notes }
 * @returns {object|null} Updated client or null
 */
export function addSupplementToCurrentClient(supplement) {
  try {
    const current = getCurrentClient();
    if (!current) return null;

    const newSupplements = Array.isArray(current.supplements) ? [...current.supplements] : [];
    newSupplements.push({
      name: supplement.name || '',
      amount: supplement.amount || '',
      notes: supplement.notes || '',
    });

    return updateCurrentClient({ supplements: newSupplements });
  } catch (error) {
    console.error('Error adding supplement:', error);
    return null;
  }
}

/**
 * Remove supplement from current client
 * @param {number} index - Supplement index
 * @returns {object|null} Updated client or null
 */
export function removeSupplementFromCurrentClient(index) {
  try {
    const current = getCurrentClient();
    if (!current) return null;

    const newSupplements = Array.isArray(current.supplements) ? [...current.supplements] : [];
    newSupplements.splice(index, 1);

    return updateCurrentClient({ supplements: newSupplements });
  } catch (error) {
    console.error('Error removing supplement:', error);
    return null;
  }
}

/**
 * Add meal to current client
 * @param {object} meal - Meal object { name, protein, carbs, fats }
 * @returns {object|null} Updated client or null
 */
export function addMealToCurrentClient(meal) {
  try {
    const current = getCurrentClient();
    if (!current) return null;

    const newMeals = Array.isArray(current.meals) ? [...current.meals] : [];
    newMeals.push({
      name: meal.name || '',
      protein: Number(meal.protein) || 0,
      carbs: Number(meal.carbs) || 0,
      fats: Number(meal.fats) || 0,
      completed: false,
    });

    return updateCurrentClient({ meals: newMeals });
  } catch (error) {
    console.error('Error adding meal:', error);
    return null;
  }
}

/**
 * Toggle meal completion status
 * @param {number} mealIndex - Meal index
 * @returns {object|null} Updated client or null
 */
export function toggleMealCompletion(mealIndex) {
  try {
    const current = getCurrentClient();
    if (!current) return null;

    const meals = Array.isArray(current.meals) ? [...current.meals] : [];
    if (meals[mealIndex]) {
      meals[mealIndex].completed = !meals[mealIndex].completed;
    }

    return updateCurrentClient({ meals });
  } catch (error) {
    console.error('Error toggling meal completion:', error);
    return null;
  }
}

/**
 * Calculate macros from completed meals
 * @param {array} meals - Array of meal objects
 * @returns {object} Object with totalProtein, totalCarbs, totalFats
 */
export function calculateMacros(meals = []) {
  const completed = meals.filter((m) => m.completed);
  return {
    totalProtein: completed.reduce((sum, m) => sum + (Number(m.protein) || 0), 0),
    totalCarbs: completed.reduce((sum, m) => sum + (Number(m.carbs) || 0), 0),
    totalFats: completed.reduce((sum, m) => sum + (Number(m.fats) || 0), 0),
  };
}

/**
 * Calculate days until competition date
 * @param {string|Date} competitionDate - Competition date
 * @returns {number|null} Days remaining or null if no date set
 */
export function calculateDaysLeft(competitionDate) {
  if (!competitionDate) return null;

  try {
    const date = new Date(competitionDate);
    if (Number.isNaN(date.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (error) {
    console.error('Error calculating days left:', error);
    return null;
  }
}

/**
 * Update current client's profile data
 * @param {object} profileData - Profile data to update
 * @returns {object|null} Updated client or null
 */
export function updateClientProfile(profileData = {}) {
  try {
    const current = getCurrentClient();
    if (!current) return null;

    const updated = updateCurrentClient({
      profile: {
        ...current.profile,
        ...profileData,
      },
    });

    return updated;
  } catch (error) {
    console.error('Error updating profile:', error);
    return null;
  }
}

/**
 * Update current client's nutrition data
 * @param {object} nutritionData - Nutrition data to update
 * @returns {object|null} Updated client or null
 */
export function updateClientNutrition(nutritionData = {}) {
  try {
    const current = getCurrentClient();
    if (!current) return null;

    const updated = updateCurrentClient({
      nutrition: {
        ...current.nutrition,
        ...nutritionData,
      },
    });

    return updated;
  } catch (error) {
    console.error('Error updating nutrition:', error);
    return null;
  }
}

/**
 * Delete a client by ID
 * @param {string} clientId - Client ID
 */
export function deleteClient(clientId) {
  try {
    const clients = getAllClients();
    const filtered = clients.filter((c) => c.id !== clientId);
    saveAllClients(filtered);

    const current = getCurrentClient();
    if (current && current.id === clientId) {
      clearCurrentClient();
    }
  } catch (error) {
    console.error('Error deleting client:', error);
  }
}

/**
 * Export all client data (for backup)
 * @returns {string} JSON string of all clients
 */
export function exportAllClientsData() {
  try {
    const clients = getAllClients();
    return JSON.stringify(clients, null, 2);
  } catch (error) {
    console.error('Error exporting clients data:', error);
    return '[]';
  }
}

/**
 * Import client data (restore from backup)
 * @param {string} jsonData - JSON string of clients
 */
export function importClientsData(jsonData) {
  try {
    const clients = JSON.parse(jsonData);
    if (Array.isArray(clients)) {
      saveAllClients(clients);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error importing clients data:', error);
    return false;
  }
}

/**
 * Clear all data (logout + reset)
 */
export function clearAllData() {
  try {
    localStorage.removeItem(CLIENTS_KEY);
    localStorage.removeItem(CURRENT_CLIENT_KEY);
  } catch (error) {
    console.error('Error clearing all data:', error);
  }
}
