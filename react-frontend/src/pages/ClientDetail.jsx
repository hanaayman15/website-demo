import { Link } from 'react-router-dom';
import { useClientDetail } from '../hooks/useClientDetail';
import '../assets/styles/react-pages.css';

function ClientDetail() {
  const {
    selectedClientId,
    loading,
    saving,
    error,
    message,
    client,
    weekDays,
    selectedDay,
    setSelectedDay,
    programsState,
    updateNotes,
    updateProgramField,
    addMeal,
    updateMeal,
    moveMealUp,
    moveMealDown,
    deleteMeal,
    saveNotes,
  } = useClientDetail();

  const dayMeals = programsState.dayMeals[selectedDay] || [];

  if (loading) {
    return <main className="react-page-wrap">Loading client details...</main>;
  }

  return (
    <main className="react-page-wrap react-grid" style={{ gap: '1rem' }}>
      <section className="react-panel">
        <h1 style={{ marginTop: 0 }}>Client Detail</h1>
        <p style={{ marginBottom: 0 }}>
          Client ID: {selectedClientId || 'N/A'}
          {client?.name ? ` | Name: ${client.name}` : ''}
        </p>
      </section>

      {error ? <div className="react-alert react-alert-error">{error}</div> : null}
      {message ? <div className="react-alert react-alert-success">{message}</div> : null}

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Programs Fields</h2>
        <form onSubmit={saveNotes} className="react-grid">
          <label>
            <span className="react-label">Notes</span>
            <textarea
              className="react-textarea"
              rows={6}
              value={programsState.programFields.notesText}
              onChange={(event) => updateNotes(event.target.value)}
              placeholder="Enter notes from Programs section"
            />
          </label>
          <label>
            <span className="react-label">Mental Observation</span>
            <textarea
              className="react-textarea"
              rows={3}
              value={programsState.programFields.mentalText}
              onChange={(event) => updateProgramField('mentalText', event.target.value)}
              placeholder="Mental notes"
            />
          </label>
          <label>
            <span className="react-label">Supplements</span>
            <textarea
              className="react-textarea"
              rows={3}
              value={programsState.programFields.supplementsText}
              onChange={(event) => updateProgramField('supplementsText', event.target.value)}
              placeholder="Supplements list"
            />
          </label>
          <div className="react-grid react-grid-2">
            <label>
              <span className="react-label">Competition Status</span>
              <input
                className="react-input"
                value={programsState.programFields.competitionStatus}
                onChange={(event) => updateProgramField('competitionStatus', event.target.value)}
                placeholder="On / Off"
              />
            </label>
            <label className="react-inline-toggle">
              <input
                type="checkbox"
                checked={programsState.programFields.competitionEnabled}
                onChange={(event) => updateProgramField('competitionEnabled', event.target.checked)}
              />
              <span>Competition Enabled</span>
            </label>
          </div>
          <button className="react-btn" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Programs'}
          </button>
        </form>
      </section>

      <section className="react-panel react-grid">
        <div className="react-row-between">
          <h2 style={{ marginTop: 0, marginBottom: 0 }}>Weekly Meal Plan</h2>
          <button className="react-btn" type="button" onClick={addMeal}>+ Add Meal</button>
        </div>

        <div className="react-day-tabs">
          {weekDays.map((day) => (
            <button
              key={day}
              type="button"
              className={`react-day-tab ${day === selectedDay ? 'active' : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              {day}
            </button>
          ))}
        </div>

        {!dayMeals.length ? (
          <p className="react-muted" style={{ margin: 0 }}>No meals added for {selectedDay}.</p>
        ) : (
          <div className="react-meals-list">
            {dayMeals.map((meal, index) => (
              <article key={meal.id} className="react-meal-card">
                <div className="react-grid react-grid-2">
                  <label>
                    <span className="react-label">Meal Type</span>
                    <input
                      className="react-input"
                      value={meal.type}
                      onChange={(event) => updateMeal(meal.id, 'type', event.target.value)}
                    />
                  </label>
                  <label>
                    <span className="react-label">Time</span>
                    <input
                      className="react-input"
                      value={meal.time}
                      onChange={(event) => updateMeal(meal.id, 'time', event.target.value)}
                    />
                  </label>
                </div>

                <label>
                  <span className="react-label">English Description</span>
                  <textarea
                    className="react-textarea"
                    rows={2}
                    value={meal.en}
                    onChange={(event) => updateMeal(meal.id, 'en', event.target.value)}
                  />
                </label>

                <label>
                  <span className="react-label">Arabic Description</span>
                  <textarea
                    className="react-textarea"
                    rows={2}
                    value={meal.ar}
                    onChange={(event) => updateMeal(meal.id, 'ar', event.target.value)}
                  />
                </label>

                <div className="react-row-between">
                  <small className="react-muted">Meal #{index + 1}</small>
                  <div className="react-inline-actions">
                    <button className="react-btn react-btn-ghost" type="button" onClick={() => moveMealUp(meal.id)}>Up</button>
                    <button className="react-btn react-btn-ghost" type="button" onClick={() => moveMealDown(meal.id)}>Down</button>
                    <button className="react-btn react-btn-danger" type="button" onClick={() => deleteMeal(meal.id)}>Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="react-panel">
        <h2 style={{ marginTop: 0 }}>Profile Snapshot</h2>
        <div className="stat-list">
          <article className="stat-item">
            <div className="stat-label">Weight</div>
            <div className="stat-value">{client?.weight ?? 'N/A'}</div>
          </article>
          <article className="stat-item">
            <div className="stat-label">Goal Weight</div>
            <div className="stat-value">{client?.goalWeight ?? client?.goal_weight ?? 'N/A'}</div>
          </article>
          <article className="stat-item">
            <div className="stat-label">TDEE</div>
            <div className="stat-value">{client?.tdee ?? 'N/A'}</div>
          </article>
        </div>
      </section>

      <section className="react-panel">
        <h2 style={{ marginTop: 0 }}>Navigation</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link className="react-btn" to="/dashboard">Dashboard</Link>
          <Link className="react-btn" to="/clients">Clients</Link>
        </div>
      </section>
    </main>
  );
}

export default ClientDetail;
