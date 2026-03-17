import { Link } from 'react-router-dom';
import { useDoctorDashboard } from '../hooks/useDoctorDashboard';
import '../assets/styles/react-pages.css';

function DoctorDashboard() {
  const { loading, error, config, role, summary, teams, refresh, logout } = useDoctorDashboard();

  const routeMap = {
    'doctor_dashboard.html': '/doctor-dashboard',
    'clients.html': '/clients',
    'add_team.html': '/add-team',
    'team_view.html': '/team-view',
  };

  const toRoute = (href) => {
    const raw = String(href || '').trim();
    if (!raw) return '/doctor-dashboard';
    if (raw.startsWith('/')) return raw;
    if (routeMap[raw]) return routeMap[raw];
    return `/${raw.replace('.html', '').replaceAll('_', '-')}`;
  };

  if (loading) {
    return <main className="react-page-wrap">Loading doctor dashboard...</main>;
  }

  return (
    <main className="react-page-wrap react-grid" style={{ gap: '1rem' }}>
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: '0.35rem' }}>Doctor Dashboard</h1>
          <p className="react-muted" style={{ margin: 0 }}>
            Signed in as {role}. Manage teams, review roster coverage, and launch team workflows.
          </p>
        </div>
        <div className="react-inline-actions">
          <button className="react-btn react-btn-ghost" type="button" onClick={refresh}>Refresh</button>
          <button className="react-btn react-btn-ghost" type="button" onClick={logout}>Logout</button>
        </div>
      </section>

      {error ? <div className="react-alert react-alert-error">{error}</div> : null}

      <section className="react-panel">
        <h2 style={{ marginTop: 0, marginBottom: '0.4rem' }}>{config.quick_actions_title || 'Quick Actions.'}</h2>
        <p className="react-muted" style={{ marginTop: 0 }}>{config.quick_actions_description || ''}</p>
        <div className="stat-list">
          <article className="stat-item">
            <div className="stat-label">Total Teams</div>
            <div className="stat-value">{summary.totalTeams}</div>
          </article>
          <article className="stat-item">
            <div className="stat-label">Total Players</div>
            <div className="stat-value">{summary.totalPlayers}</div>
          </article>
          <article className="stat-item">
            <div className="stat-label">Average Players / Team</div>
            <div className="stat-value">
              {summary.totalTeams ? (summary.totalPlayers / summary.totalTeams).toFixed(1) : '0.0'}
            </div>
          </article>
        </div>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Navigation</h2>
        <div className="react-inline-actions">
          {(config.navigation || []).map((item) => (
            <Link key={`${item.label}-${item.href}`} className="react-btn react-btn-ghost" to={toRoute(item.href)}>
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Modules</h2>
        <div className="react-grid react-grid-2">
          {(config.modules || []).map((module) => (
            <article key={`${module.label}-${module.href}`} className="stat-item react-grid" style={{ gap: '0.45rem' }}>
              <h3 style={{ margin: 0 }}>{module.label}</h3>
              <p className="react-muted" style={{ margin: 0 }}>{module.description}</p>
              <div>
                <Link className="react-btn" to={toRoute(module.href)}>Open</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="react-panel" style={{ overflowX: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>Recent Teams</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.65rem' }}>Team</th>
              <th style={{ textAlign: 'left', padding: '0.65rem' }}>Coach</th>
              <th style={{ textAlign: 'left', padding: '0.65rem' }}>Players</th>
              <th style={{ textAlign: 'left', padding: '0.65rem' }}>Package</th>
            </tr>
          </thead>
          <tbody>
            {!teams.length ? (
              <tr>
                <td className="react-muted" style={{ padding: '0.65rem' }} colSpan={4}>No teams available yet.</td>
              </tr>
            ) : (
              teams.slice(0, 8).map((team) => (
                <tr key={`doctor-team-${team.id}`}>
                  <td style={{ padding: '0.65rem' }}>{team.team_name || 'Untitled Team'}</td>
                  <td style={{ padding: '0.65rem' }}>{team.coach_name || 'N/A'}</td>
                  <td style={{ padding: '0.65rem' }}>{team.players_count ?? 0}</td>
                  <td style={{ padding: '0.65rem' }}>{team.package_size || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

export default DoctorDashboard;
