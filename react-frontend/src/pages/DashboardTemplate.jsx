import { useDashboardTemplatePlayground } from '../hooks/useDashboardTemplatePlayground';
import '../assets/styles/react-pages.css';

function DashboardTemplate() {
  const {
    state,
    filteredRows,
    setSearchTerm,
    updateFormField,
    resetForm,
  } = useDashboardTemplatePlayground();

  const submitForm = (event) => {
    event.preventDefault();
    window.alert('Template form data captured in controlled state.');
  };

  const stats = state.stats;
  const form = state.form;

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1200, gap: '1rem' }}>
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Nutrition Dashboard Template</h1>
        <p className="react-muted" style={{ margin: 0 }}>Reusable controlled template for dashboard-like pages.</p>
      </section>

      <section className="react-panel">
        <div className="stat-list">
          <article className="stat-item"><div className="stat-label">Active Teams</div><div className="stat-value">{stats.activeTeams}</div></article>
          <article className="stat-item"><div className="stat-label">Total Clients</div><div className="stat-value">{stats.totalClients}</div></article>
          <article className="stat-item"><div className="stat-label">Today Check-ins</div><div className="stat-value">{stats.todayCheckins}</div></article>
          <article className="stat-item"><div className="stat-label">Pending Diet Updates</div><div className="stat-value">{stats.pendingDiets}</div></article>
        </div>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Clients / Teams Table Placeholder</h2>
        <label>
          <span className="react-label">Search records</span>
          <input
            className="react-input"
            value={state.searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search teams, clients, coaches, email..."
          />
        </label>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.65rem' }}>Client/Team</th>
              <th style={{ textAlign: 'left', padding: '0.65rem' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '0.65rem' }}>Package</th>
              <th style={{ textAlign: 'left', padding: '0.65rem' }}>Coach</th>
              <th style={{ textAlign: 'left', padding: '0.65rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td style={{ padding: '0.65rem' }}>{row.label}</td>
                <td style={{ padding: '0.65rem' }}>{row.email}</td>
                <td style={{ padding: '0.65rem' }}>{row.package}</td>
                <td style={{ padding: '0.65rem' }}>{row.coach}</td>
                <td style={{ padding: '0.65rem' }}>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Reusable Form Placeholder</h2>
        <form className="react-grid react-grid-2" onSubmit={submitForm}>
          <label>
            <span className="react-label">Full Name</span>
            <input className="react-input" value={form.fullName} onChange={(event) => updateFormField('fullName', event.target.value)} />
          </label>
          <label>
            <span className="react-label">Sport</span>
            <select className="react-input" value={form.sport} onChange={(event) => updateFormField('sport', event.target.value)}>
              <option value="">Select sport</option>
              <option value="football">Football</option>
              <option value="boxing">Boxing</option>
              <option value="swimming">Swimming</option>
            </select>
          </label>
          <label>
            <span className="react-label">Program Goal</span>
            <select className="react-input" value={form.goal} onChange={(event) => updateFormField('goal', event.target.value)}>
              <option value="cut">Cut</option>
              <option value="maintain">Maintain</option>
              <option value="bulk">Bulk</option>
            </select>
          </label>
          <label>
            <span className="react-label">Next Check-in</span>
            <input className="react-input" type="date" value={form.checkinDate} onChange={(event) => updateFormField('checkinDate', event.target.value)} />
          </label>
          <label style={{ gridColumn: '1/-1' }}>
            <span className="react-label">Notes</span>
            <textarea className="react-textarea" rows={3} value={form.notes} onChange={(event) => updateFormField('notes', event.target.value)} />
          </label>
          <div className="react-inline-actions" style={{ gridColumn: '1/-1' }}>
            <button className="react-btn react-btn-ghost" type="button" onClick={resetForm}>Reset</button>
            <button className="react-btn" type="submit">Save Form</button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default DashboardTemplate;
