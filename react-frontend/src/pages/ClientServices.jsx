import { Link } from 'react-router-dom';
import { useClientServicesContext } from '../hooks/useClientServicesContext';
import '../assets/styles/react-pages.css';

function ClientServices() {
  const { summary, links } = useClientServicesContext();

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 980, gap: '1rem' }}>
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Client Services</h1>
        <Link className="react-btn react-btn-ghost" to="/clients">← Back to Clients</Link>
      </section>

      <section className="react-panel">
        <p style={{ margin: 0, fontWeight: 700 }}>
          Client: {summary.name} ID: {summary.id} Email: {summary.email}
        </p>
      </section>

      <section className="react-grid react-grid-2">
        <article className="react-panel react-grid" style={{ gap: '0.35rem' }}>
          <h2 style={{ margin: 0 }}>Nutrition</h2>
          <p className="react-muted" style={{ margin: 0 }}>Open and manage the nutrition profile for this client.</p>
          <Link className="react-btn" to={links.nutrition}>Open Nutrition</Link>
        </article>
        <article className="react-panel react-grid" style={{ gap: '0.35rem' }}>
          <h2 style={{ margin: 0 }}>Mental Coaching</h2>
          <p className="react-muted" style={{ margin: 0 }}>Mental coaching module for this client.</p>
          <Link className="react-btn" to={links.mental}>Open Mental Coaching</Link>
        </article>
        <article className="react-panel react-grid" style={{ gap: '0.35rem' }}>
          <h2 style={{ margin: 0 }}>Anti-Doping</h2>
          <p className="react-muted" style={{ margin: 0 }}>Anti-doping resources for this client.</p>
          <Link className="react-btn" to={links.antiDoping}>Open Anti-Doping</Link>
        </article>
      </section>
    </main>
  );
}

export default ClientServices;
