import Navbar from '../components/layout/Navbar';
import Card from '../components/ui/Card';
import '../assets/styles/react-pages.css';

function Resources() {
  const links = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/features', label: 'Features' },
    { path: '/contact', label: 'Contact' },
  ];

  const resources = [
    { title: 'Nutrition Basics Guide', body: 'Foundational principles for sustainable nutrition habits and meal timing.' },
    { title: 'Performance Meal Templates', body: 'Sample meal structures to support training and recovery days.' },
    { title: 'Coach Check-in Checklist', body: 'A repeatable structure for weekly coaching reviews and adjustments.' },
  ];

  return (
    <main className="react-page-wrap react-grid" style={{ gap: '1rem' }}>
      <Navbar links={links} />
      <section className="react-panel">
        <h1 style={{ marginTop: 0 }}>Resources</h1>
        <p className="react-muted" style={{ marginBottom: 0 }}>Hand-picked learning and implementation material for clients and coaches.</p>
      </section>
      <section className="react-grid">
        {resources.map((item) => (
          <Card key={item.title} title={item.title}>
            <p style={{ margin: 0 }}>{item.body}</p>
          </Card>
        ))}
      </section>
    </main>
  );
}

export default Resources;
