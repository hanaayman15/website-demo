import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReports } from '../hooks/useReports';
import ClientPortalNav from '../components/layout/ClientPortalNav';
import '../assets/styles/react-pages.css';

function ProgressTracking() {
  const {
    loading,
    submitting,
    error,
    message,
    summary,
    measurementForm,
    updateMeasurementField,
    saveMeasurements,
    logWorkout,
    logMood,
    logSleep,
  } = useReports();

  const [workoutInput, setWorkoutInput] = useState('');
  const [moodInput, setMoodInput] = useState('');
  const [sleepInput, setSleepInput] = useState('');

  if (loading) {
    return (
      <div>
        <ClientPortalNav activePath="/progress" isLoggedIn />
        <main className="react-page-wrap">Loading progress data...</main>
      </div>
    );
  }

  const currentWeightText = summary.latestWeight === null || summary.latestWeight === undefined
    ? '--'
    : Number(summary.latestWeight).toFixed(1);
  const bodyFatText = summary.bodyFat === null || summary.bodyFat === undefined
    ? '--'
    : Number(summary.bodyFat).toFixed(1);

  const submitWorkout = async (event) => {
    event.preventDefault();
    await logWorkout(workoutInput);
    setWorkoutInput('');
  };

  const submitMood = async (event) => {
    event.preventDefault();
    await logMood(moodInput);
    setMoodInput('');
  };

  const submitSleep = async (event) => {
    event.preventDefault();
    await logSleep(sleepInput);
    setSleepInput('');
  };

  return (
    <div>
      <ClientPortalNav activePath="/progress" isLoggedIn />
      <main className="react-page-wrap react-grid" style={{ gap: '1rem' }}>
        <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ marginTop: 0, marginBottom: '0.35rem' }}>Track Your Growth</h1>
            <p className="react-muted" style={{ margin: 0 }}>Monitor your progress across key performance indicators.</p>
          </div>
          <div className="react-inline-actions">
            <Link className="react-btn react-btn-ghost" to="/progress">Quick View</Link>
            <Link className="react-btn react-btn-ghost" to="/settings">Settings</Link>
          </div>
        </section>

      {error ? <div className="react-alert react-alert-error">{error}</div> : null}
      {message ? <div className="react-alert react-alert-success">{message}</div> : null}

      <section className="react-panel">
        <div className="stat-list">
          <article className="stat-item">
            <div className="stat-label">Current Weight</div>
            <div className="stat-value">{currentWeightText} kg</div>
            <div className="react-muted" style={{ fontSize: '0.85rem' }}>{summary.weightTrend}</div>
          </article>
          <article className="stat-item">
            <div className="stat-label">Body Fat</div>
            <div className="stat-value">{bodyFatText}%</div>
          </article>
          <article className="stat-item">
            <div className="stat-label">Strength Score</div>
            <div className="stat-value">{summary.strengthScore}/100</div>
          </article>
          <article className="stat-item">
            <div className="stat-label">Avg Mood</div>
            <div className="stat-value">{summary.avgMood ?? '--'}/10</div>
          </article>
        </div>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Update Measurements</h2>
        <form className="react-grid react-grid-2" onSubmit={(event) => { event.preventDefault(); saveMeasurements(); }}>
          <label>
            <span className="react-label">Weight (kg)</span>
            <input
              className="react-input"
              value={measurementForm.weight}
              onChange={(event) => updateMeasurementField('weight', event.target.value)}
              type="number"
              step="0.1"
              required
            />
          </label>
          <label>
            <span className="react-label">Body Fat %</span>
            <input
              className="react-input"
              value={measurementForm.bodyFat}
              onChange={(event) => updateMeasurementField('bodyFat', event.target.value)}
              type="number"
              step="0.1"
            />
          </label>
          <label>
            <span className="react-label">Muscle Mass (kg)</span>
            <input
              className="react-input"
              value={measurementForm.muscleMass}
              onChange={(event) => updateMeasurementField('muscleMass', event.target.value)}
              type="number"
              step="0.1"
            />
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="react-btn" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Measurements'}
            </button>
          </div>
        </form>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Activity Logs</h2>
        <div className="react-grid react-grid-2">
          <form className="react-grid" onSubmit={submitWorkout}>
            <label>
              <span className="react-label">Workout Name</span>
              <input
                className="react-input"
                value={workoutInput}
                onChange={(event) => setWorkoutInput(event.target.value)}
                placeholder="Running, Push Day, Squats"
              />
            </label>
            <button className="react-btn react-btn-ghost" type="submit" disabled={submitting}>Log Workout</button>
          </form>

          <form className="react-grid" onSubmit={submitMood}>
            <label>
              <span className="react-label">Mood (1-10)</span>
              <input
                className="react-input"
                value={moodInput}
                onChange={(event) => setMoodInput(event.target.value)}
                type="number"
                min="1"
                max="10"
              />
            </label>
            <button className="react-btn react-btn-ghost" type="submit" disabled={submitting}>Log Mood</button>
          </form>

          <form className="react-grid" onSubmit={submitSleep}>
            <label>
              <span className="react-label">Sleep Hours</span>
              <input
                className="react-input"
                value={sleepInput}
                onChange={(event) => setSleepInput(event.target.value)}
                type="number"
                step="0.1"
                min="0"
              />
            </label>
            <button className="react-btn react-btn-ghost" type="submit" disabled={submitting}>Log Sleep</button>
          </form>
        </div>
      </section>

        <section className="react-panel" style={{ overflowX: 'auto' }}>
          <h2 style={{ marginTop: 0 }}>Recent Weight & Body Fat Logs</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.65rem' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '0.65rem' }}>Weight</th>
              <th style={{ textAlign: 'left', padding: '0.65rem' }}>Body Fat</th>
            </tr>
          </thead>
          <tbody>
            {!summary.recentWeights.length ? (
              <tr><td style={{ padding: '0.65rem' }} colSpan={3} className="react-muted">No data yet.</td></tr>
            ) : (
              summary.recentWeights.map((row) => (
                <tr key={`weight-${row.label}`}>
                  <td style={{ padding: '0.65rem' }}>{row.label}</td>
                  <td style={{ padding: '0.65rem' }}>{row.weight ?? '--'} kg</td>
                  <td style={{ padding: '0.65rem' }}>{row.bodyFat ?? '--'}%</td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

export default ProgressTracking;
