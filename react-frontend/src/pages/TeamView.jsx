import { Link } from 'react-router-dom';
import { useTeamView } from '../hooks/useTeamView';
import '../assets/styles/react-pages.css';

function TeamView() {
  const { state, canOpenPlayerDetails } = useTeamView();

  if (state.loading) {
    return <main className="react-page-wrap">Loading team details...</main>;
  }

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1240, gap: '1rem' }}>
      <section className="react-panel">
        <Link className="react-btn react-btn-ghost" to="/clients">Back to Teams</Link>
      </section>

      {state.error ? <section className="react-alert react-alert-error">{state.error}</section> : null}

      <section className="react-panel react-grid react-grid-2">
        <article className="stat-item"><div className="stat-label">Team Name</div><div className="stat-value">{state.team?.team_name || '-'}</div></article>
        <article className="stat-item"><div className="stat-label">Coach</div><div className="stat-value">{state.team?.coach_name || '-'}</div></article>
        <article className="stat-item"><div className="stat-label">Sport</div><div className="stat-value">{state.team?.sport_type || '-'}</div></article>
        <article className="stat-item"><div className="stat-label">Package Size</div><div className="stat-value">{state.team?.package_size || '-'}</div></article>
        <article className="stat-item"><div className="stat-label">Players</div><div className="stat-value">{state.team?.players_count || 0}</div></article>
      </section>

      <section className="react-panel" style={{ overflowX: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>Players</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>#</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Client ID</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Full Name</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Phone</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Gender</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Height/Weight</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {state.rows.map((row) => (
              <tr key={`player-${row.number}`}>
                <td style={{ padding: '0.5rem', borderTop: '1px solid #e5e7eb' }}>{row.number}</td>
                <td style={{ padding: '0.5rem', borderTop: '1px solid #e5e7eb' }}>{row.clientId}</td>
                <td style={{ padding: '0.5rem', borderTop: '1px solid #e5e7eb' }}>{row.fullName}</td>
                <td style={{ padding: '0.5rem', borderTop: '1px solid #e5e7eb' }}>{row.email}</td>
                <td style={{ padding: '0.5rem', borderTop: '1px solid #e5e7eb' }}>{row.phone}</td>
                <td style={{ padding: '0.5rem', borderTop: '1px solid #e5e7eb' }}>{row.gender}</td>
                <td style={{ padding: '0.5rem', borderTop: '1px solid #e5e7eb' }}>{row.heightWeight}</td>
                <td style={{ padding: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
                  {canOpenPlayerDetails && row.detailHref ? (
                    <Link className="react-btn react-btn-ghost" to={row.detailHref}>Player Details</Link>
                  ) : (
                    <span className="react-muted">Doctor or admin only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

export default TeamView;
