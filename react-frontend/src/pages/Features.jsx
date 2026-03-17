import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Card from '../components/ui/Card';
import '../assets/styles/react-pages.css';

function Features() {
  const links = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/resources', label: 'Resources' },
    { path: '/contact', label: 'Contact' },
  ];

  const featureCards = [
    { title: 'Client Dashboard', description: 'Macro adherence, meal completion, and daily guidance in one place.' },
    { title: 'Coach Operations', description: 'Manage clients, meal plans, and onboarding workflows efficiently.' },
    { title: 'Progress Tracking', description: 'Track weight, mood, and habits with trend visibility over time.' },
    { title: 'PDF Reporting', description: 'Generate shareable reports for client follow-up and accountability.' },
  ];

  return (
    <main className="react-page-wrap react-grid" style={{ gap: '1rem' }}>
      <Navbar links={links} />
      <section className="react-panel">
        <h1 style={{ marginTop: 0 }}>Platform Features</h1>
        <p className="react-muted" style={{ marginBottom: 0 }}>A practical toolkit for nutrition coaching and client execution.</p>
      </section>

      <section className="stat-list">
        {featureCards.map((item) => (
          <Card key={item.title} title={item.title}>
            <p style={{ margin: 0 }}>{item.description}</p>
          </Card>
        ))}
      </section>

      <div className="react-inline-actions">
        <Link className="react-btn" to="/client-signup">Start Now</Link>
        <Link className="react-btn react-btn-ghost" to="/plans">View Plans</Link>
      </div>
    </main>
  );
}

export default Features;
