import { useAddTeam } from '../hooks/useAddTeam';
import '../assets/styles/react-pages.css';

function AddTeam() {
  const { state, canSave, setField, setPackageSize, updatePlayerField, autofillPlayers, save } = useAddTeam();

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1200, gap: '1rem' }}>
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: '0.35rem' }}>{state.editingTeamId ? 'Edit Team' : 'Add Team'}</h1>
          <p className="react-muted" style={{ margin: 0 }}>Roster builder with player-level calculations and payload prep.</p>
        </div>
        <button className="react-btn react-btn-ghost" type="button" onClick={autofillPlayers}>Autofill Players</button>
      </section>

      {state.error ? <div className="react-alert react-alert-error">{state.error}</div> : null}
      {state.success ? <div className="react-alert react-alert-success">{state.success}</div> : null}

      <form className="react-grid" style={{ gap: '1rem' }} onSubmit={save}>
        <section className="react-panel react-grid react-grid-2">
          <label><span className="react-label">Team Name</span><input className="react-input" value={state.teamName} onChange={(e) => setField('teamName', e.target.value)} /></label>
          <label><span className="react-label">Sport Type</span><input className="react-input" value={state.sportType} onChange={(e) => setField('sportType', e.target.value)} /></label>
          <label><span className="react-label">Coach Name</span><input className="react-input" value={state.coachName} onChange={(e) => setField('coachName', e.target.value)} /></label>
          <label><span className="react-label">Start Date</span><input className="react-input" type="date" value={state.startDate} onChange={(e) => setField('startDate', e.target.value)} /></label>
          <label><span className="react-label">Package Size</span>
            <select className="react-input" value={state.packageSize || ''} onChange={(e) => setPackageSize(Number(e.target.value) || 0)}>
              <option value="">Select</option>
              <option value="20">20 Players</option>
              <option value="25">25 Players</option>
              <option value="30">30 Players</option>
            </select>
          </label>
          <div className="stat-item" style={{ alignSelf: 'end' }}>{state.players.length} players generated</div>
        </section>

        <section className="react-grid">
          {state.players.map((player, index) => (
            <article key={player.player_number} className="react-panel react-grid" style={{ gap: '0.6rem' }}>
              <h2 style={{ margin: 0 }}>Player {index + 1}</h2>
              <div className="react-grid react-grid-2">
                <label><span className="react-label">Full Name</span><input className="react-input" value={player.full_name} onChange={(e) => updatePlayerField(index, 'full_name', e.target.value)} /></label>
                <label><span className="react-label">Email</span><input className="react-input" value={player.email} onChange={(e) => updatePlayerField(index, 'email', e.target.value)} /></label>
                <label><span className="react-label">Gender</span><select className="react-input" value={player.gender} onChange={(e) => updatePlayerField(index, 'gender', e.target.value)}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label>
                <label><span className="react-label">Birthday</span><input className="react-input" type="date" value={player.birthday} onChange={(e) => updatePlayerField(index, 'birthday', e.target.value)} /></label>
                <label><span className="react-label">Height</span><input className="react-input" value={player.height} onChange={(e) => updatePlayerField(index, 'height', e.target.value)} /></label>
                <label><span className="react-label">Weight</span><input className="react-input" value={player.weight} onChange={(e) => updatePlayerField(index, 'weight', e.target.value)} /></label>
                <label><span className="react-label">Activity</span><select className="react-input" value={player.activity_level} onChange={(e) => updatePlayerField(index, 'activity_level', e.target.value)}><option value="sedentary">Sedentary</option><option value="light">Light</option><option value="moderate">Moderate</option><option value="active">Active</option><option value="very-active">Very Active</option><option value="extremely-active">Extremely Active</option></select></label>
                <label><span className="react-label">Progression</span><select className="react-input" value={player.progression_type} onChange={(e) => updatePlayerField(index, 'progression_type', e.target.value)}><option value="cut">Cut</option><option value="maintain">Maintain</option><option value="bulk">Bulk</option></select></label>
                <label><span className="react-label">BMI</span><input className="react-input" value={player.bmi} readOnly /></label>
                <label><span className="react-label">BMR</span><input className="react-input" value={player.bmr} readOnly /></label>
                <label><span className="react-label">TDEE</span><input className="react-input" value={player.tdee} readOnly /></label>
                <label><span className="react-label">Calories</span><input className="react-input" value={player.calories} readOnly /></label>
              </div>
            </article>
          ))}
        </section>

        <section className="react-panel react-inline-actions" style={{ justifyContent: 'flex-end' }}>
          <button className="react-btn" type="submit" disabled={state.saving || !canSave}>{state.saving ? 'Saving...' : (state.editingTeamId ? 'Update Team' : 'Save Team')}</button>
        </section>
      </form>
    </main>
  );
}

export default AddTeam;
