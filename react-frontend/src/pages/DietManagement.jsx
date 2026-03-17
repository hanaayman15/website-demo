import { useDietManagement } from '../hooks/useDietManagement';
import '../assets/styles/react-pages.css';

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
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1220, gap: '1rem' }}>
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: '0.35rem' }}>Diet Management</h1>
          <p className="react-muted" style={{ margin: 0 }}>Manage reusable diet templates and meal timing.</p>
        </div>
        <button className="react-btn" type="button" onClick={openCreate}>+ Create New Plan</button>
      </section>

      {state.error ? <div className="react-alert react-alert-error">{state.error}</div> : null}
      {state.message ? <div className="react-alert react-alert-success">{state.message}</div> : null}

      <section className="react-grid react-grid-2">
        {plansWithSummary.map(({ index, plan, summary }) => (
          <article key={`plan-${index}`} className="react-panel react-grid" style={{ gap: '0.5rem' }}>
            <h2 style={{ margin: 0 }}>{summary.caloriesLabel}</h2>
            <p className="react-muted" style={{ margin: 0 }}>{summary.type}</p>
            <p className="react-muted" style={{ margin: 0 }}>{summary.totalMeals} meals</p>
            <div className="react-inline-actions">
              <button className="react-btn react-btn-ghost" type="button" onClick={() => openEdit(index)}>Edit</button>
              <button className="react-btn react-btn-danger" type="button" onClick={() => deletePlan(index)}>Delete</button>
            </div>
          </article>
        ))}
      </section>

      {!plansWithSummary.length ? <section className="react-panel react-muted">No diet plans yet. Create your first plan.</section> : null}

      {state.modalOpen ? (
        <section className="react-panel react-grid" style={{ borderColor: '#bfdbfe', background: '#eff6ff' }}>
          <h2 style={{ margin: 0 }}>{state.editingIndex >= 0 ? 'Edit Meal Plan' : 'Create New Diet Plan'}</h2>
          <div className="react-grid react-grid-2">
            <label><span className="react-label">Min Calories</span><input className="react-input" type="number" value={state.draft.minCalories} onChange={(e) => updateField('minCalories', e.target.value)} /></label>
            <label><span className="react-label">Max Calories</span><input className="react-input" type="number" value={state.draft.maxCalories} onChange={(e) => updateField('maxCalories', e.target.value)} /></label>
            <label style={{ gridColumn: '1 / -1' }}><span className="react-label">Diet Type</span><input className="react-input" value={state.draft.dietType} onChange={(e) => updateField('dietType', e.target.value)} /></label>
          </div>

          <div className="react-day-tabs">
            {constants.days.map((day) => (
              <button
                key={day}
                type="button"
                className={`react-day-tab ${state.activeDay === day ? 'active' : ''}`}
                onClick={() => setActiveDay(day)}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="react-grid react-grid-2">
            {constants.meals.map((meal) => (
              <article key={meal} className="stat-item react-grid" style={{ gap: '0.45rem' }}>
                <h3 style={{ margin: 0 }}>{meal}</h3>
                <label><span className="react-label">Time</span><input className="react-input" type="time" value={state.draft[state.activeDay][meal].time} onChange={(e) => updateMeal(state.activeDay, meal, 'time', e.target.value)} /></label>
                <label><span className="react-label">English</span><textarea className="react-textarea" value={state.draft[state.activeDay][meal].en} onChange={(e) => updateMeal(state.activeDay, meal, 'en', e.target.value)} /></label>
                <label><span className="react-label">Arabic</span><textarea className="react-textarea" value={state.draft[state.activeDay][meal].ar} onChange={(e) => updateMeal(state.activeDay, meal, 'ar', e.target.value)} /></label>
              </article>
            ))}
          </div>

          <div className="react-inline-actions" style={{ justifyContent: 'flex-end' }}>
            <button className="react-btn react-btn-ghost" type="button" onClick={closeModal}>Cancel</button>
            <button className="react-btn" type="button" onClick={savePlan}>Save Plan</button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

export default DietManagement;
