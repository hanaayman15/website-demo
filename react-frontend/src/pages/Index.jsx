import { Link } from 'react-router-dom';
import '../assets/styles/react-pages.css';

function Index() {
  const actions = [
    { label: 'Clients', path: '/clients', description: 'View and manage clients and teams.' },
    { label: 'Add Client', path: '/add-client', description: 'Create a new client profile.' },
    { label: 'Add Team', path: '/doctor-auth?next=%2Fadd-team', description: 'Doctor sign in to create teams.' },
    { label: 'PDF Generator', path: '/pdf-generator', description: 'Generate multi-client PDF reports.' },
    { label: 'Diet Management', path: '/diet-management', description: 'Edit default meal plans.' },
  ];

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1100, gap: '1rem' }}>
      <section className="react-panel react-grid" style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0 }}>Client Nutrition Management</h1>
        <p className="react-muted" style={{ margin: 0 }}>Quick actions for administration and coaching workflows.</p>
      </section>

      <section className="react-grid react-grid-2">
        {actions.map((action) => (
          <article key={action.label} className="react-panel react-grid" style={{ gap: '0.4rem' }}>
            <h2 style={{ margin: 0 }}>{action.label}</h2>
            <p className="react-muted" style={{ margin: 0 }}>{action.description}</p>
            <Link className="react-btn" to={action.path}>Open</Link>
          </article>
        ))}
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Client Portal</h2>
        <p className="react-muted" style={{ margin: 0 }}>
          Athletes can access their personalized dashboard, mental coaching, and progress tracking.
        </p>
        <div className="react-inline-actions">
          <Link className="react-btn react-btn-ghost" to="/client-home">Client Home</Link>
          <Link className="react-btn react-btn-ghost" to="/client-login">Client Login</Link>
        </div>
      </section>
    </main>
  );
}

export default Index;
