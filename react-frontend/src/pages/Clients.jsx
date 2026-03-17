import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sourceLabel, useClientList } from '../hooks/useClientList';
import '../assets/styles/react-pages.css';

function Clients() {
  const navigate = useNavigate();
  const {
    isAdmin,
    searchTerm,
    setSearchTerm,
    loadingTeams,
    loadingClients,
    error,
    filteredTeams,
    filteredAddClientData,
    filteredProfileSetupData,
    refreshAll,
    deleteClient,
    deleteTeam,
    exportTeamCsv,
  } = useClientList();

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Delete this client?')) return;
    try {
      await deleteClient(clientId);
    } catch (err) {
      window.alert(err?.response?.data?.detail || err?.message || 'Delete failed');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Delete this team and all linked players?')) return;
    try {
      await deleteTeam(teamId);
    } catch (err) {
      window.alert(err?.response?.data?.detail || err?.message || 'Delete failed');
    }
  };

  const handleExportTeamCsv = async (teamId) => {
    try {
      await exportTeamCsv(teamId);
    } catch (err) {
      window.alert(err?.response?.data?.detail || err?.message || 'CSV export failed');
    }
  };

  const loading = loadingTeams || (isAdmin && loadingClients);

  const renderClientRows = (data, emptyText) => {
    if (!data.length) {
      return (
        <tr>
          <td colSpan={8} className="react-muted" style={{ textAlign: 'center', padding: '1rem' }}>{emptyText}</td>
        </tr>
      );
    }

    return data.map((client) => (
      <tr key={`client-${client.id}`}>
        <td>{client.display_id || client.id || '-'}</td>
        <td>{client.full_name || '-'}</td>
        <td>{client.email || '-'}</td>
        <td>{client.phone || '-'}</td>
        <td>{client.gender || '-'}</td>
        <td>{client.sport || '-'}</td>
        <td>{sourceLabel(client.created_source)}</td>
        <td>
          <div className="react-inline-actions">
            <Link className="react-btn react-btn-ghost" to={`/client-detail?id=${encodeURIComponent(client.id)}`}>
              View
            </Link>
            <Link className="react-btn react-btn-ghost" to={`/add-client?client_id=${encodeURIComponent(client.id)}`}>
              Basic
            </Link>
            <Link className="react-btn react-btn-ghost" to={`/client-nutrition-profile?client_id=${encodeURIComponent(client.id)}`}>
              Nutrition
            </Link>
            <Link className="react-btn react-btn-ghost" to={`/client-services?client_id=${encodeURIComponent(client.id)}`}>
              Services
            </Link>
            <button className="react-btn react-btn-danger" type="button" onClick={() => handleDeleteClient(client.id)}>
              Delete
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <main className="react-page-wrap react-grid" style={{ gap: '1rem' }}>
      <section className="react-panel">
        <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0 }}>Clients & Teams</h1>
          <div className="react-inline-actions">
            <button className="react-btn react-btn-ghost" type="button" onClick={() => navigate(-1)}>
              Back
            </button>
            <Link className="react-btn react-btn-ghost" to={isAdmin ? '/' : '/doctor-dashboard'}>
              Home
            </Link>
            {isAdmin ? <Link className="react-btn" to="/add-client">Add Client</Link> : null}
          </div>
        </div>
      </section>

      {error ? <div className="react-alert react-alert-error">{error}</div> : null}

      <section className="react-panel react-grid" style={{ gap: '0.75rem' }}>
        <input
          className="react-input"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={isAdmin ? 'Search teams and clients by name, email, coach, source...' : 'Search teams by name, coach, package size...'}
        />
        <div className="stat-list">
          <article className="stat-item">
            <div className="stat-label">Teams</div>
            <div className="stat-value">{filteredTeams.length}</div>
          </article>
          {isAdmin ? (
            <article className="stat-item">
              <div className="stat-label">Add Client Profiles</div>
              <div className="stat-value">{filteredAddClientData.length}</div>
            </article>
          ) : null}
          {isAdmin ? (
            <article className="stat-item">
              <div className="stat-label">Profile Setup Profiles</div>
              <div className="stat-value">{filteredProfileSetupData.length}</div>
            </article>
          ) : null}
        </div>
      </section>

      <section className="react-panel" style={{ overflowX: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>Teams Section</h2>
        {loading ? <p className="react-muted">Loading teams...</p> : null}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.7rem' }}>Team Name</th>
              <th style={{ textAlign: 'left', padding: '0.7rem' }}>Package</th>
              <th style={{ textAlign: 'left', padding: '0.7rem' }}>Players</th>
              <th style={{ textAlign: 'left', padding: '0.7rem' }}>Coach</th>
              <th style={{ textAlign: 'left', padding: '0.7rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!filteredTeams.length ? (
              <tr>
                <td colSpan={5} className="react-muted" style={{ textAlign: 'center', padding: '1rem' }}>
                  No teams found.
                </td>
              </tr>
            ) : (
              filteredTeams.map((team) => (
                <tr key={`team-${team.id}`}>
                  <td style={{ padding: '0.7rem' }}>{team.team_name || '-'}</td>
                  <td style={{ padding: '0.7rem' }}>{team.package_size || '-'}</td>
                  <td style={{ padding: '0.7rem' }}>{team.players_count || 0}</td>
                  <td style={{ padding: '0.7rem' }}>{team.coach_name || '-'}</td>
                  <td style={{ padding: '0.7rem' }}>
                    <div className="react-inline-actions">
                      <Link className="react-btn react-btn-ghost" to={`/team-view?id=${encodeURIComponent(team.id)}`}>
                        View
                      </Link>
                      {isAdmin ? (
                        <Link className="react-btn react-btn-ghost" to={`/add-team?id=${encodeURIComponent(team.id)}`}>
                          Edit
                        </Link>
                      ) : null}
                      {isAdmin ? (
                        <button className="react-btn react-btn-danger" type="button" onClick={() => handleDeleteTeam(team.id)}>
                          Delete
                        </button>
                      ) : null}
                      {isAdmin ? (
                        <button className="react-btn react-btn-ghost" type="button" onClick={() => handleExportTeamCsv(team.id)}>
                          CSV
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {isAdmin ? (
        <section className="react-panel" style={{ overflowX: 'auto' }}>
          <h2 style={{ marginTop: 0 }}>Clients Created From Add Client Page</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Client ID</th>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Full Name</th>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Phone</th>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Gender</th>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Sport</th>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Source</th>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>{renderClientRows(filteredAddClientData, 'No clients found from Add Client page.')}</tbody>
          </table>
        </section>
      ) : null}

      {isAdmin ? (
        <section className="react-panel" style={{ overflowX: 'auto' }}>
          <h2 style={{ marginTop: 0 }}>Clients Created From Profile Setup Page</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Client ID</th>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Full Name</th>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Phone</th>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Gender</th>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Sport</th>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Source</th>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>{renderClientRows(filteredProfileSetupData, 'No clients found from Profile Setup page.')}</tbody>
          </table>
        </section>
      ) : null}
    </main>
  );
}

export default Clients;
