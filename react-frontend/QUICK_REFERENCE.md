# Quick Reference - Data Persistence API

## Import Paths

```javascript
// Core data manager
import {
  getCurrentClient,
  setCurrentClient,
  getCurrentClient,
  addOrUpdateClient,
  findClientByEmailAndPassword,
  updateCurrentClient,
  updateClientProfile,
  updateClientNutrition,
  addSupplementToCurrentClient,
  calculateMacros,
  calculateDaysLeft,
} from '../utils/clientDataManager';

// Hooks
import { useDashboardClientData } from '../hooks/useDashboardClientData';
import { useMealCompletion } from '../hooks/useMealCompletion';
import { useSupplementsManager } from '../hooks/useSupplementsManager';
```

---

## Quick Examples

### Get Current Client
```javascript
const client = getCurrentClient();
console.log(client.fullName); // "John Doe"
console.log(client.profile.weight); // 75
console.log(client.nutrition.calories); // 2500
```

### Update Client Info
```javascript
updateCurrentClient({
  fullName: "Jane Smith",
  email: "jane@example.com",
  phone: "+1234567890"
});
```

### Update Profile Data
```javascript
updateClientProfile({
  weight: 72,
  height: 175,
  goalWeight: 70,
  competitionDate: "2026-06-15"
});
```

### Update Nutrition Targets
```javascript
updateClientNutrition({
  calories: 2700,
  proteinTarget: 160,
  carbsTarget: 320,
  fatsTarget: 85,
  waterIntake: 2200
});
```

### Use Dashboard Hook
```javascript
function MyComponent() {
  const {
    client,
    profile,
    nutrition,
    meals,
    supplements,
    daysUntilCompetition,
    loading,
    updateProfile,
    refresh
  } = useDashboardClientData();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome {client.fullName}</h1>
      <p>Weight: {profile.weight} kg</p>
      <p>Target: {profile.goalWeight} kg</p>
      <p>Days until competition: {daysUntilCompetition}</p>
      <button onClick={() => updateProfile({ weight: 70 })}>
        Update Weight
      </button>
    </div>
  );
}
```

### Use Meal Completion Hook
```javascript
function MealTracker() {
  const {
    meals,
    macros,
    addMeal,
    toggleMealCompletion,
    getCompletionStats
  } = useMealCompletion();

  const stats = getCompletionStats(); // { total, completed, percentage }

  return (
    <div>
      <h2>Meals ({stats.completed}/{stats.total})</h2>
      {meals.map((meal, i) => (
        <div key={i}>
          <label>
            <input
              type="checkbox"
              checked={meal.completed}
              onChange={() => toggleMealCompletion(i)}
            />
            {meal.name}
          </label>
          <p>P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fats}g</p>
        </div>
      ))}
      <p>Total: P {macros.totalProtein}g | C {macros.totalCarbs}g | F {macros.totalFats}g</p>
    </div>
  );
}
```

### Use Supplements Hook
```javascript
function SupplementsManager() {
  const {
    supplements,
    addSupplement,
    removeSupplement,
    loading
  } = useSupplementsManager();

  const handleAdd = async () => {
    await addSupplement({
      name: "Creatine",
      amount: "5g",
      notes: "Daily"
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>My Supplements</h2>
      {supplements.map((sup, i) => (
        <div key={i}>
          <span>{sup.name} - {sup.amount}</span>
          <button onClick={() => removeSupplement(i)}>Remove</button>
        </div>
      ))}
      <button onClick={handleAdd}>+ Add Supplement</button>
    </div>
  );
}
```

### Add Meal
```javascript
import { useMealCompletion } from '../hooks/useMealCompletion';

function AddMealForm() {
  const { addMeal } = useMealCompletion();
  const [form, setForm] = useState({
    name: '',
    protein: '',
    carbs: '',
    fats: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await addMeal(form);
    if (success) {
      setForm({ name: '', protein: '', carbs: '', fats: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Meal name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <input
        placeholder="Protein (g)"
        type="number"
        value={form.protein}
        onChange={(e) => setForm({ ...form, protein: e.target.value })}
      />
      <input
        placeholder="Carbs (g)"
        type="number"
        value={form.carbs}
        onChange={(e) => setForm({ ...form, carbs: e.target.value })}
      />
      <input
        placeholder="Fats (g)"
        type="number"
        value={form.fats}
        onChange={(e) => setForm({ ...form, fats: e.target.value })}
      />
      <button type="submit">Add Meal</button>
    </form>
  );
}
```

### Calculate Competition Days
```javascript
import { calculateDaysLeft } from '../utils/clientDataManager';

const client = getCurrentClient();
const daysLeft = calculateDaysLeft(client.profile.competitionDate);
console.log(`${daysLeft} days until competition`);
```

### Calculate Macros from Meals
```javascript
import { calculateMacros } from '../utils/clientDataManager';

const client = getCurrentClient();
const macros = calculateMacros(client.meals);
console.log(`Total Protein: ${macros.totalProtein}g`);
console.log(`Total Carbs: ${macros.totalCarbs}g`);
console.log(`Total Fats: ${macros.totalFats}g`);
```

### Display Weight Target Progress
```javascript
function WeightProgress() {
  const { profile } = useDashboardClientData();
  
  const current = Number(profile.weight) || 0;
  const goal = Number(profile.goalWeight) || 0;
  const remaining = Math.abs(current - goal);
  const percentage = goal > 0 ? ((current - goal) / goal) * 100 : 0;

  return (
    <div>
      <h3>Weight Progress</h3>
      <p>Current: {current} kg</p>
      <p>Target: {goal} kg</p>
      <p>Remaining: {remaining.toFixed(1)} kg</p>
      <progress value={percentage} max="100"></progress>
      <p>{percentage.toFixed(0)}% complete</p>
    </div>
  );
}
```

### Display Macro Progress Bars
```javascript
function MacroProgress() {
  const { macros, nutrition } = useDashboardClientData();

  const proteinPercent = (macros.totalProtein / (nutrition.proteinTarget || 1)) * 100;
  const carbsPercent = (macros.totalCarbs / (nutrition.carbsTarget || 1)) * 100;
  const fatsPercent = (macros.totalFats / (nutrition.fatsTarget || 1)) * 100;

  return (
    <div>
      <div>
        <label>Protein: {macros.totalProtein}g / {nutrition.proteinTarget}g</label>
        <progress value={proteinPercent} max="100"></progress>
      </div>
      <div>
        <label>Carbs: {macros.totalCarbs}g / {nutrition.carbsTarget}g</label>
        <progress value={carbsPercent} max="100"></progress>
      </div>
      <div>
        <label>Fats: {macros.totalFats}g / {nutrition.fatsTarget}g</label>
        <progress value={fatsPercent} max="100"></progress>
      </div>
    </div>
  );
}
```

### Check If All Meals Completed
```javascript
function MealStatus() {
  const { meals } = useMealCompletion();
  
  const allCompleted = meals.length > 0 && meals.every(m => m.completed);
  
  return (
    <div>
      {allCompleted ? (
        <p>✅ Great work! All meals completed for today.</p>
      ) : (
        <p>⚠️ Still {meals.filter(m => !m.completed).length} meals pending</p>
      )}
    </div>
  );
}
```

---

## Data Validation Rules

When creating/updating data, follow these rules:

```javascript
// Client must have email and password
{
  email: "required", // string, valid email
  password: "required", // string, min 6 chars
  fullName: "required", // string
}

// Profile fields are optional but must be valid
{
  weight: 0-300, // kg, number
  height: 100-250, // cm, number
  goalWeight: 0-300, // kg, number
  competitionDate: "YYYY-MM-DD", // date string or null
}

// Nutrition fields are optional but must be positive
{
  calories: 0+, // number
  proteinTarget: 0+, // grams
  carbsTarget: 0+, // grams
  fatsTarget: 0+, // grams
}

// Meal must have name and valid macros
{
  name: "required", // string
  protein: 0+, // grams
  carbs: 0+, // grams
  fats: 0+, // grams
  completed: true|false, // boolean
}

// Supplement must have name
{
  name: "required", // string
  amount: "optional", // string like "500mg"
  notes: "optional", // string
}
```

---

## Debugging Tips

### Clear All Data (Factory Reset)
```javascript
import { clearAllData } from '../utils/clientDataManager';
clearAllData(); // ⚠️ Removes all clients and current client
```

### Export Client Data
```javascript
import { exportAllClientsData } from '../utils/clientDataManager';
const jsonData = exportAllClientsData();
console.log(jsonData); // JSON string of all clients
// Save to file for backup
```

### Import Client Data
```javascript
import { importClientsData } from '../utils/clientDataManager';
const success = importClientsData(jsonString);
if (success) console.log('Imported successfully');
```

### View localStorage
```javascript
// In browser DevTools Console:
console.log(JSON.parse(localStorage.getItem('clients')));
console.log(JSON.parse(localStorage.getItem('currentClient')));
```

### Verify Data Integrity
```javascript
const client = getCurrentClient();
if (!client) {
  console.error('No client logged in');
} else {
  console.log('✓ Client:', client.fullName);
  console.log('✓ Profile:', Object.keys(client.profile));
  console.log('✓ Nutrition:', Object.keys(client.nutrition));
  console.log('✓ Meals:', client.meals.length);
  console.log('✓ Supplements:', client.supplements.length);
}
```

---

## Common Patterns

### Pattern 1: Form to localStorage
```javascript
const [form, setForm] = useState({ name: '', email: '' });

const handleSave = async () => {
  const success = await updateCurrentClient(form);
  if (success) {
    alert('Saved!');
    setForm({ name: '', email: '' }); // Reset form
  }
};
```

### Pattern 2: Fetch, Display, Save
```javascript
const { client, updateProfile } = useDashboardClientData();

// Display current weight
<input value={client.profile?.weight} onChange={...} />

// Save on blur or submit
const handleSave = () => {
  updateProfile({ weight: newValue });
};
```

### Pattern 3: List with CRUD
```javascript
const { meals, addMeal, removeMeal, toggleMealCompletion } = useMealCompletion();

// Create
const handleAdd = () => addMeal({ name, protein, carbs, fats });

// Read
meals.forEach(meal => console.log(meal));

// Update
const handleToggle = (index) => toggleMealCompletion(index);

// Delete
const handleRemove = (index) => removeMeal(index);
```

---

## Performance Tips

1. **Use hooks, not raw functions**: Hooks handle re-renders properly
   ```javascript
   // ✅ Good
   const { meals } = useMealCompletion();
   
   // ❌ Avoid
   const meals = getCurrentClient().meals; // Won't update
   ```

2. **Memoize expensive calculations**:
   ```javascript
   const stats = useMemo(() => getCompletionStats(), [meals]);
   ```

3. **Batch updates**:
   ```javascript
   // ✅ Good - one update with multiple changes
   updateCurrentClient({
     fullName, email, phone, country
   });
   
   // ❌ Avoid - multiple updates in sequence
   updateCurrentClient({ fullName });
   updateCurrentClient({ email });
   ```

4. **Use callback for async operations**:
   ```javascript
   const handleSave = useCallback(async () => {
     const success = await addMeal(form);
     if (success) setForm({});
   }, [form]);
   ```

---
