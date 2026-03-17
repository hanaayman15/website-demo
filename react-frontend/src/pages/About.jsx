import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import '../assets/styles/react-pages.css';

function About() {
  const links = [
    { path: '/', label: 'Home' },
    { path: '/features', label: 'Features' },
    { path: '/resources', label: 'Resources' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <main className="react-page-wrap react-grid" style={{ gap: '1rem' }}>
      <Navbar links={links} />
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>About Our Nutrition Platform</h1>
        <Sidebar links={[{ path: '/plans', label: 'Plans' }, { path: '/client-signup', label: 'Get Started' }]} />
      </section>

      <Card title="Our Mission">
        <p style={{ margin: 0 }}>
          We help clients and coaches build consistent nutrition habits through measurable tracking,
          practical coaching workflows, and data-driven progress insights.
        </p>
      </Card>

      <Card title="What Makes It Different">
        <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
          <li>Coach and client workflows in one platform</li>
          <li>Weekly plan adherence visibility and progress analytics</li>
          <li>Integrated nutrition, mood, and performance context</li>
        </ul>
      </Card>

      <div className="react-inline-actions">
        <Link className="react-btn" to="/features">Explore Features</Link>
        <Button className="react-btn react-btn-ghost" onClick={() => window.history.back()}>Go Back</Button>
      </div>
    </main>
  );
}

export default About;
