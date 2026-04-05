import { useDietManagement } from '../hooks/useDietManagement';
import AdminQuickNav from '../components/layout/AdminQuickNav';
import '../assets/styles/react-pages.css';

const PAGE_CSS = `
.diet-page {
  background-color: #dfe9f1;
  min-height: 100vh;
  padding: 20px;
}
.diet-top-nav {
  background: #fff;
  border-radius: 15px;
  border: 1px solid #d8e3f2;
  padding: 12px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  max-width: 1200px;
  margin: 0 auto 20px;
  flex-wrap: wrap;
}
.diet-nav-title {
  color: #1b3b5f;
  font-size: 16px;
  font-weight: 700;
}
.diet-nav-links {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.diet-nav-link {
  color: #1b3b5f;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  background: #f7f9fc;
  border: 1px solid #e0e0e0;
}
.diet-nav-link.active {
  background: #a8d0ee;
  border-color: #a8d0ee;
  color: #fff;
}
.diet-shell {
  max-width: 1200px;
  margin: 0 auto;
  background: #fff;
  border-radius: 15px;
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.2);
  border: 1px solid #e0e0e0;
  overflow: hidden;
}
.diet-header {
  background: #fff;
  color: #333;
  padding: 26px;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  border-bottom: 2px solid #e0e0e0;
  gap: 20px;
}
.diet-header-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}
.diet-content {
  padding: 26px;
}
.diet-section-title {
  font-size: 22px;
  font-weight: 600;
  color: #1b3b5f;
  margin: 0 0 10px;
}
.diet-section-sub {
  color: #666;
  margin: 0 0 20px;
}
.diet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}
.diet-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  background: #f9f9f9;
  transition: all 0.25s;
}
.diet-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}
.diet-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1b3b5f;
}
.diet-card-subtitle {
  margin-top: 5px;
  font-size: 13px;
  color: #666;
}
.diet-card-menu {
  border: none;
  background: none;
  color: #999;
  font-size: 20px;
  line-height: 1;
  cursor: default;
}
.diet-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
.diet-stats {
  display: flex;
  gap: 10px;
}
.diet-stat {
  flex: 1;
  text-align: center;
  padding: 10px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #eee;
}
.diet-card-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}
.diet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  overflow-y: auto;
  padding: 24px;
}
.diet-modal {
  background: #fff;
  margin: 20px auto;
  border-radius: 12px;
  max-width: 920px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}
.diet-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 20px;
  overflow-x: auto;
}
.diet-tab {
  border: none;
  background: none;
  color: #999;
  font-weight: 600;
  font-size: 14px;
  padding: 14px 18px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}
.diet-tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
}
.diet-day-panel {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 20px;
}
.diet-day-title {
  font-size: 16px;
  font-weight: 600;
  color: #1b3b5f;
  margin-bottom: 15px;
  border-bottom: 2px solid #667eea;
  padding-bottom: 10px;
}
.diet-meals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}
.diet-meal-item {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
}
.diet-meal-type {
  font-weight: 600;
  color: #1b3b5f;
  font-size: 14px;
  margin-bottom: 8px;
}
.diet-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}
@media (max-width: 768px) {
  .diet-top-nav {
    flex-direction: column;
    align-items: flex-start;
  }
  .diet-header {
    grid-template-columns: 1fr;
  }
}
`;

const DAY_META = {
  sunday: { en: 'Sunday', ar: 'الأحد' },
  monday: { en: 'Monday', ar: 'الاثنين' },
  tuesday: { en: 'Tuesday', ar: 'الثلاثاء' },
  wednesday: { en: 'Wednesday', ar: 'الأربعاء' },
  thursday: { en: 'Thursday', ar: 'الخميس' },
  friday: { en: 'Friday', ar: 'الجمعة' },
  saturday: { en: 'Saturday', ar: 'السبت' },
};

const MEAL_META = {
  breakfast: { en: 'Breakfast', ar: 'فطور' },
  snack1: { en: 'Snack 1', ar: 'سناك 1' },
  lunch: { en: 'Lunch', ar: 'الغداء' },
  dinner: { en: 'Dinner', ar: 'العشاء' },
  preworkout: { en: 'Pre-Workout', ar: 'قبل التمرين' },
  postworkout: { en: 'Post-Workout', ar: 'بعد التمرين' },
};

function DietManagement() {
  const {
    state,
    constants,
    plansWithSummary,
    openCreate,
    openEdit,
    closeModal,
    setActiveDay,
    updateField,
    updateMeal,
    savePlan,
    deletePlan,
  } = useDietManagement();

  return (
    <main
  className="diet-page"
>
  <style>{PAGE_CSS}</style>

  <div style={{ maxWidth: 1200, margin: '0 auto 20px' }}>
    <AdminQuickNav activePath="/diet-management" title="Diet Management" />
  </div>

  {/* MAIN CARD */}
  <section className="diet-shell">

    {/* HEADER */}
    <section className="diet-header">
      <h1 className="diet-header-title">Diet Management</h1>
      <button className="react-btn" onClick={openCreate}>
        + New Plan
      </button>
    </section>

    {/* CONTENT */}
    <section className="diet-content">

      {state.error && (
        <div className="react-alert react-alert-error">{state.error}</div>
      )}

      {state.message && (
        <div className="react-alert react-alert-success">{state.message}</div>
      )}

      <div>
        <h2 className="diet-section-title">Default Diet Plans</h2>
        <p className="diet-section-sub">
          Templates automatically assigned to clients
        </p>
      </div>

      {/* GRID */}
      <section className="diet-grid">
        {plansWithSummary.map(({ index, summary }) => (
          <article key={index} className="diet-card">
            <div className="diet-card-header">
              <div>
                <div className="diet-card-title">{summary.caloriesLabel}</div>
                <div className="diet-card-subtitle">{summary.type}</div>
                <div className="diet-card-subtitle">{summary.totalMeals} meals</div>
              </div>
              <button className="diet-card-menu" aria-label="Plan menu" type="button">⋯</button>
            </div>

            <div className="diet-stats">
              <div className="diet-stat">
                <div className="stat-value">{summary.min}</div>
                <div className="stat-label">Min</div>
              </div>
              <div className="diet-stat">
                <div className="stat-value">{summary.max}</div>
                <div className="stat-label">Max</div>
              </div>
            </div>

            <div className="diet-card-actions">
              <button
                className="react-btn react-btn-ghost"
                onClick={() => openEdit(index)}
              >
                Edit
              </button>

              <button
                className="react-btn react-btn-danger"
                onClick={() => deletePlan(index)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>

      {!plansWithSummary.length && (
        <section className="react-panel react-muted">
          No diet plans yet.
        </section>
      )}
    </section>
  </section>

  {/* MODAL */}
  {state.modalOpen && (
    <section className="diet-overlay">
      <div className="diet-modal">

        <h2>
          {state.editingIndex >= 0
            ? 'Edit Plan'
            : 'Create Plan'}
        </h2>

        <div className="react-grid react-grid-2">
          <input
            type="number"
            placeholder="Min Calories"
            value={state.draft.minCalories}
            onChange={(e) =>
              updateField('minCalories', e.target.value)
            }
          />

          <input
            type="number"
            placeholder="Max Calories"
            value={state.draft.maxCalories}
            onChange={(e) =>
              updateField('maxCalories', e.target.value)
            }
          />
        </div>

        <input
          placeholder="Diet Type (optional)"
          value={state.draft.dietType}
          onChange={(e) =>
            updateField('dietType', e.target.value)
          }
        />

        {/* DAYS */}
        <div className="diet-tabs">
          {constants.days.map((day) => (
            <button
              key={day}
              className={`diet-tab ${
                state.activeDay === day ? 'active' : ''
              }`}
              onClick={() => setActiveDay(day)}
            >
              {DAY_META[day]?.en}
            </button>
          ))}
        </div>

        {/* MEALS */}
        <div className="diet-meals-grid">
          {constants.meals.map((meal) => (
            <div key={meal} className="diet-meal-item">
              <strong>{MEAL_META[meal]?.en}</strong>

              <input
                type="time"
                value={state.draft[state.activeDay][meal].time}
                onChange={(e) =>
                  updateMeal(
                    state.activeDay,
                    meal,
                    'time',
                    e.target.value
                  )
                }
              />

              <textarea
                placeholder="English"
                value={state.draft[state.activeDay][meal].en}
                onChange={(e) =>
                  updateMeal(
                    state.activeDay,
                    meal,
                    'en',
                    e.target.value
                  )
                }
              />

              <textarea
                placeholder="Arabic"
                value={state.draft[state.activeDay][meal].ar}
                onChange={(e) =>
                  updateMeal(
                    state.activeDay,
                    meal,
                    'ar',
                    e.target.value
                  )
                }
              />
            </div>
          ))}
        </div>

        {/* ACTIONS */}
        <div className="diet-modal-actions">
          <button className="react-btn-ghost" onClick={closeModal}>
            Cancel
          </button>

          <button className="react-btn" onClick={savePlan}>
            Save
          </button>
        </div>
      </div>
    </section>
  )}
</main>
  );
}

export default DietManagement;