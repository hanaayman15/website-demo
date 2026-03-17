import { Link } from 'react-router-dom';
import { useReports } from '../hooks/useReports';
import '../assets/styles/react-pages.css';

function Progress() {
  const { loading, error, message, summary } = useReports();

  if (loading) {
    return <main className="react-page-wrap">Loading progress overview...</main>;
  }

  const moodBars = summary.recentMood.map((row) => ({
    ...row,
    width: `${Math.min(Math.max(Number(row.mood || 0) * 10, 0), 100)}%`,
  }));

  return (
    <main className="react-page-wrap react-grid" style={{ gap: '1rem' }}>
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: '0.35rem' }}>Progress Overview</h1>
          <p className="react-muted" style={{ margin: 0 }}>Quick snapshot of your recent measurements and wellbeing.</p>
        </div>
        <div className="react-inline-actions">
          <Link className="react-btn" to="/progress-tracking">Open Full Tracking</Link>
          <Link className="react-btn react-btn-ghost" to="/client-dashboard">Dashboard</Link>
        </div>
      </section>

      {error ? <div className="react-alert react-alert-error">{error}</div> : null}
      {message ? <div className="react-alert react-alert-success">{message}</div> : null}

      <section className="react-panel">
        <div className="stat-list">
          <article className="stat-item">
            <div className="stat-label">Current Weight</div>
            <div className="stat-value">{summary.latestWeight ?? '--'} kg</div>
          </article>
          <article className="stat-item">
            <div className="stat-label">Body Fat</div>
            <div className="stat-value">{summary.bodyFat ?? '--'}%</div>
          </article>
          <article className="stat-item">
            <div className="stat-label">Average Mood</div>
            <div className="stat-value">{summary.avgMood ?? '--'}/10</div>
          </article>
          <article className="stat-item">
            <div className="stat-label">Weight Trend</div>
            <div className="stat-value" style={{ fontSize: '1rem' }}>{summary.weightTrend}</div>
          </article>
        </div>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Mood Trend</h2>
        {!moodBars.length ? (
          <p className="react-muted" style={{ margin: 0 }}>No mood logs yet.</p>
        ) : (
          moodBars.map((row) => (
            <div key={`mood-${row.label}`} className="react-macro-row">
              <div className="react-row-between">
                <span>{row.label}</span>
                <span>{row.mood ?? '--'}/10</span>
              </div>
              <div className="react-progress-track">
                <div className="react-progress-fill" style={{ width: row.width }} />
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

export default Progress;
