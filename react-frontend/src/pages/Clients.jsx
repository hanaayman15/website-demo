import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sourceLabel, useClientList } from '../hooks/useClientList';

const PAGE_CSS = `
.clients-page { max-width: 1100px; margin: 24px auto 40px; padding: 0 16px; }
.clients-page body, .clients-page { font-family: "Source Sans Pro", sans-serif; }
.top-nav { background: rgba(255, 255, 255, 0.84); border: 1px solid rgba(47, 109, 47, 0.35); border-radius: 14px; padding: 12px 18px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; backdrop-filter: blur(4px); }
.top-nav-title { color: #111315; font-size: 18px; font-weight: 700; }
.top-nav-links { display: flex; gap: 8px; flex-wrap: wrap; }
.top-nav-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.link-btn { text-decoration: none; color: #8fbfe3; background: rgba(233, 245, 236, 0.92); border: 1px solid #86b394; border-radius: 9px; padding: 8px 12px; font-size: 13px; font-weight: 700; cursor: pointer; }
.link-btn.primary { background: #8fbfe3; color: #fff; border-color: #8fbfe3; }
.cp-card { background: rgba(255,255, 255, 0.84); border: 1.6px solid #8fbfe3; border-radius: 14px; box-shadow: 0 2px 12px rgba(25, 80, 25, 0.12); padding: 16px; margin-bottom: 14px; backdrop-filter: blur(6px); }
.toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.cp-search { flex: 1; min-width: 220px; border: 1px solid #8fbfe3; border-radius: 10px; padding: 10px 12px; font-size: 14px; background: rgba(247, 253, 248, 0.92); }
.count-pill { background: rgba(226, 243, 229, 0.95); color: #070808; border: 1px solid #8fbfe3; border-radius: 999px; padding: 8px 12px; font-size: 13px; font-weight: 700; }
.count-strip { display: flex; gap: 10px; flex-wrap: wrap; }
.section-title { margin: 0 0 10px; color: #0f0f10; font-size: 17px; font-weight: 800; }
.cp-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.cp-table th, .cp-table td { text-align: left; padding: 12px 10px; border-bottom: 1px solid rgba(62, 111, 62, 0.25); }
.cp-table th { color: #0f1010; font-size: 13px; letter-spacing: .2px; background: rgba(222, 241, 227, 0.92); }
.cp-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-view { display: inline-block; text-decoration: none; font-size: 13px; font-weight: 700; border-radius: 8px; border: 1px solid #799f81; color: #8fbfe3; background: #ecf7ee; padding: 6px 10px; cursor: pointer; }
.btn-nutrition { border-color: #8fbfe3; background: #d7f0dc; color: #8fbfe3; }
.btn-mental { border-color: #8fbfe3; background: #ebf4d7; color: #8fbfe3; }
.btn-anti { border-color: #8fbfe3; background: #d8f2ef; color: #8fbfe3; }
.btn-danger { border: 1px solid #f3c0c0; color: #8b2b2b; background: #fff5f5; }
.cp-empty { text-align: center; color: #60758c; padding: 24px 10px; }
.cp-error { margin-top: 10px; color: #962d2d; background: #fff2f2; border: 1px solid #ffd2d2; border-radius: 10px; padding: 10px; font-size: 13px; }
.source-pill { display: inline-block; border-radius: 999px; border: 1px solid #161717; background: #eaf6ed; color: #8fbfe3; padding: 3px 9px; font-size: 12px; font-weight: 700; }
@media (max-width: 768px) {
  .top-nav-links { width: 100%; flex-direction: column; gap: 6px; border-top: 1px solid #edf2f8; padding-top: 10px; margin-top: 2px; }
  .link-btn { width: 100%; text-align: center; }
  .cp-table { font-size: 13px; }
  .cp-table th, .cp-table td { padding: 10px 7px; }
  .hide-mobile { display: none; }
}
`;

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

  useEffect(() => { refreshAll(); }, [refreshAll]);

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Delete this client?')) return;
    try { await deleteClient(clientId); }
    catch (err) { window.alert(err?.response?.data?.detail || err?.message || 'Delete failed'); }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Delete this team and all linked players?')) return;
    try { await deleteTeam(teamId); }
    catch (err) { window.alert(err?.response?.data?.detail || err?.message || 'Delete failed'); }
  };

  const handleExportTeamCsv = async (teamId) => {
    try { await exportTeamCsv(teamId); }
    catch (err) { window.alert(err?.response?.data?.detail || err?.message || 'CSV export failed'); }
  };

  const loading = loadingTeams || (isAdmin && loadingClients);
  const teamsEmptyText = isAdmin
    ? 'No teams found.'
    : 'No teams found. Create one from Add Team or ask admin to assign teams to your account.';

  const renderClientRows = (data, emptyText) => {
    if (!data.length) return <tr><td colSpan={8} className="cp-empty">{emptyText}</td></tr>;
    return data.map((client) => (
      <tr key={`client-${client.id}`}>
        <td>{client.display_id || client.id || '-'}</td>
        <td>{client.full_name || '-'}</td>
        <td className="hide-mobile">{client.email || '-'}</td>
        <td className="hide-mobile">{client.phone || '-'}</td>
        <td className="hide-mobile">{client.gender || '-'}</td>
        <td>{client.sport || '-'}</td>
        <td className="hide-mobile"><span className="source-pill">{sourceLabel(client.created_source)}</span></td>
        <td>
          <div className="cp-actions">
            <Link className="btn-view" to={`/client-detail?id=${encodeURIComponent(client.id)}`}>View</Link>
            <Link className="btn-view" to={`/add-client?client_id=${encodeURIComponent(client.id)}`}>Basic</Link>
            <Link className="btn-view btn-nutrition" to={`/client-nutrition-profile?client_id=${encodeURIComponent(client.id)}`}>Nutrition</Link>
            <Link className="btn-view btn-mental" to={`/mental-coaching?client_id=${encodeURIComponent(client.id)}`}>Mental Coaching</Link>
            <Link className="btn-view btn-anti" to={`/anti-doping?client_id=${encodeURIComponent(client.id)}`}>Anti-Doping</Link>
            <Link className="btn-view" to={`/client-services?client_id=${encodeURIComponent(client.id)}`}>Services</Link>
            <button className="btn-view btn-danger" type="button" onClick={() => handleDeleteClient(client.id)}>Delete</button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div
        className="clients-page"

      >
        {/* Nav */}
        <div className="top-nav">
          <div className="top-nav-left">
            <button className="link-btn" type="button" onClick={() => navigate(-1)}>Back</button>
            <div className="top-nav-title">Clients &amp; Teams</div>
          </div>
          <div className="top-nav-links">
            <Link className="link-btn" to="/">Home</Link>
            <Link className="link-btn primary" to="/clients">Clients</Link>
            <Link className="link-btn" to="/add-team">Add Team</Link>
            {isAdmin && <Link className="link-btn" to="/add-client">Add Client</Link>}
          </div>
        </div>

        {error && <div className="cp-card cp-error">{error}</div>}

        {/* Search + counts */}
        <div className="cp-card">
          <div className="toolbar">
            <input
              className="cp-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search teams and clients by name, email, coach, source..."
            />
            <div className="count-strip">
              <span className="count-pill">{filteredTeams.length} teams</span>
              {isAdmin && <span className="count-pill">{filteredAddClientData.length} add-client profiles</span>}
              {isAdmin && <span className="count-pill">{filteredProfileSetupData.length} profile-setup profiles</span>}
            </div>
          </div>
        </div>

        {/* Teams table */}
        <div className="cp-card" style={{ overflowX: 'auto' }}>
          <h2 className="section-title">Teams Section</h2>
          {loading && <p style={{ color: '#60758c', fontSize: 13 }}>Loading teams...</p>}
          <table className="cp-table">
            <thead>
              <tr>
                <th>Team Name</th><th>Package</th><th>Players</th><th>Coach</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!filteredTeams.length
                ? <tr><td colSpan={5} className="cp-empty">{teamsEmptyText}</td></tr>
                : filteredTeams.map((team) => (
                  <tr key={`team-${team.id}`}>
                    <td>{team.team_name || '-'}</td>
                    <td>{team.package_size || '-'}</td>
                    <td>{team.players_count || 0}</td>
                    <td>{team.coach_name || '-'}</td>
                    <td>
                      <div className="cp-actions">
                        <Link className="btn-view" to={`/team-view?id=${encodeURIComponent(team.id)}`}>View</Link>
                        {isAdmin && <Link className="btn-view" to={`/add-team?id=${encodeURIComponent(team.id)}`}>Edit</Link>}
                        {isAdmin && <button className="btn-view btn-danger" type="button" onClick={() => handleDeleteTeam(team.id)}>Delete</button>}
                        {isAdmin && <button className="btn-view" type="button" onClick={() => handleExportTeamCsv(team.id)}>CSV</button>}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Add Client table */}
        {isAdmin && (
          <div className="cp-card" style={{ overflowX: 'auto' }}>
            <h2 className="section-title">Clients Created From Add Client Page</h2>
            <table className="cp-table">
              <thead>
                <tr>
                  <th>Client ID</th><th>Full Name</th>
                  <th className="hide-mobile">Email</th><th className="hide-mobile">Phone</th>
                  <th className="hide-mobile">Gender</th><th>Sport</th>
                  <th className="hide-mobile">Source</th><th>Action</th>
                </tr>
              </thead>
              <tbody>{renderClientRows(filteredAddClientData, 'No clients found from Add Client page.')}</tbody>
            </table>
          </div>
        )}

        {/* Profile Setup table */}
        {isAdmin && (
          <div className="cp-card" style={{ overflowX: 'auto' }}>
            <h2 className="section-title">Clients Created From Profile Setup Page</h2>
            <table className="cp-table">
              <thead>
                <tr>
                  <th>Client ID</th><th>Full Name</th>
                  <th className="hide-mobile">Email</th><th className="hide-mobile">Phone</th>
                  <th className="hide-mobile">Gender</th><th>Sport</th>
                  <th className="hide-mobile">Source</th><th>Action</th>
                </tr>
              </thead>
              <tbody>{renderClientRows(filteredProfileSetupData, 'No clients found from Profile Setup page.')}</tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default Clients;
