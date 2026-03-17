import { Link } from 'react-router-dom';
import { useClientServicesContext } from '../hooks/useClientServicesContext';
import '../assets/styles/react-pages.css';

function ClientServices() {
  const { summary, links } = useClientServicesContext();

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 980, gap: '1rem' }}>
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Client Services</h1>
        <Link className="react-btn react-btn-ghost" to="/clients">Back to Clients</Link>
      </section>

      <section className="react-panel react-grid react-grid-2">
        <article className="stat-item"><div className="stat-label">Client</div><div className="stat-value">{summary.name}</div></article>
        <article className="stat-item"><div className="stat-label">ID</div><div className="stat-value">{summary.id}</div></article>
        <article className="stat-item" style={{ gridColumn: '1/-1' }}><div className="stat-label">Email</div><div className="stat-value" style={{ fontSize: '1rem' }}>{summary.email}</div></article>
      </section>

      <section className="react-grid react-grid-2">
        <article className="react-panel react-grid" style={{ gap: '0.35rem' }}>
          <h2 style={{ margin: 0 }}>Nutrition</h2>
          <p className="react-muted" style={{ margin: 0 }}>Manage nutrition profile and plan adjustments.</p>
          <Link className="react-btn" to={links.nutrition}>Open Nutrition</Link>
        </article>
        <article className="react-panel react-grid" style={{ gap: '0.35rem' }}>
          <h2 style={{ margin: 0 }}>Mental Coaching</h2>
          <p className="react-muted" style={{ margin: 0 }}>Open mental coaching module for this client.</p>
          <Link className="react-btn" to={links.mental}>Open Mental Coaching</Link>
        </article>
        <article className="react-panel react-grid" style={{ gap: '0.35rem' }}>
          <h2 style={{ margin: 0 }}>Anti-Doping</h2>
          <p className="react-muted" style={{ margin: 0 }}>Open anti-doping resources and guidance.</p>
          <Link className="react-btn" to={links.antiDoping}>Open Anti-Doping</Link>
        </article>
      </section>
    </main>
  );
}

export default ClientServices;
