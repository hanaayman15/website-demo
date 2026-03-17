import Navbar from '../components/layout/Navbar';
import Card from '../components/ui/Card';
import '../assets/styles/react-pages.css';

function SuccessStories() {
  const links = [
    { path: '/', label: 'Home' },
    { path: '/features', label: 'Features' },
    { path: '/resources', label: 'Resources' },
    { path: '/contact', label: 'Contact' },
  ];

  const stories = [
    {
      title: 'From Inconsistent to Structured',
      body: 'A recreational athlete improved meal consistency and reached weight goals within 12 weeks.',
    },
    {
      title: 'Competition Prep Confidence',
      body: 'A competitive client used weekly tracking and coach feedback to maintain stage-readiness.',
    },
    {
      title: 'Better Habits, Better Recovery',
      body: 'A busy professional improved sleep and recovery scores by aligning nutrition and schedule.',
    },
  ];

  return (
    <main className="react-page-wrap react-grid" style={{ gap: '1rem' }}>
      <Navbar links={links} />
      <section className="react-panel">
        <h1 style={{ marginTop: 0 }}>Success Stories</h1>
        <p className="react-muted" style={{ marginBottom: 0 }}>Real outcomes from structured coaching and consistent execution.</p>
      </section>
      <section className="react-grid">
        {stories.map((story) => (
          <Card key={story.title} title={story.title}>
            <p style={{ margin: 0 }}>{story.body}</p>
          </Card>
        ))}
      </section>
    </main>
  );
}

export default SuccessStories;
