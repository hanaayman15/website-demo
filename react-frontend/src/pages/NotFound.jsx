import { Link } from 'react-router-dom';
import '../assets/styles/react-pages.css';

function NotFound() {
  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 900, gap: '1rem' }}>
      <section className="react-panel react-grid" style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0 }}>404 - Page Not Found</h1>
        <p className="react-muted" style={{ margin: 0 }}>
          The page you requested does not exist or has been moved.
        </p>
        <div className="react-inline-actions" style={{ justifyContent: 'center' }}>
          <Link className="react-btn" to="/">Go Home</Link>
          <Link className="react-btn react-btn-ghost" to="/client-dashboard">Dashboard</Link>
        </div>
      </section>
    </main>
  );
}

export default NotFound;
