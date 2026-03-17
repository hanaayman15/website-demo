import { Link } from 'react-router-dom';
import '../assets/styles/react-pages.css';

function NextCheckin() {
  const checkinDate = localStorage.getItem('nextCheckinDate') || '';
  const isScheduled = Boolean(checkinDate);
  const statusLabel = isScheduled ? 'Scheduled' : 'Not Scheduled';

  const viewDetails = () => {
    window.alert('Contact your nutritionist from settings to schedule your next check-in.');
  };

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 720, gap: '1rem' }}>
      <section className="react-panel react-grid" style={{ textAlign: 'center' }}>
        <h1 style={{ marginTop: 0, marginBottom: 0 }}>Next Check-in</h1>
        <div className="stat-item" style={{ background: isScheduled ? '#ecfdf5' : '#fffbeb', borderColor: isScheduled ? '#86efac' : '#fcd34d' }}>
          <div className="stat-label">Status</div>
          <div className="stat-value" style={{ fontSize: '1.1rem' }}>{statusLabel}</div>
          <p className="react-muted" style={{ margin: '0.35rem 0 0 0' }}>
            {isScheduled ? `Your next check-in is on ${checkinDate}.` : 'Your next nutrition check-in has not been scheduled yet.'}
          </p>
        </div>

        <div className="react-panel" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Contact your nutritionist</p>
          <p className="react-muted" style={{ margin: '0.35rem 0 0 0' }}>
            Regular check-ins help monitor progress and update your nutrition strategy.
          </p>
        </div>

        <div className="react-inline-actions" style={{ justifyContent: 'center' }}>
          <button className="react-btn" type="button" onClick={viewDetails}>View Details</button>
          <Link className="react-btn react-btn-ghost" to="/client-dashboard">Back to Dashboard</Link>
        </div>
      </section>
    </main>
  );
}

export default NextCheckin;
