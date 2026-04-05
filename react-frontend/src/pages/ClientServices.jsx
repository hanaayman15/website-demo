import { Link } from 'react-router-dom';
import { useClientServicesContext } from '../hooks/useClientServicesContext';
import '../assets/styles/react-pages.css';

const ACCENT = '#6eabf2';

const SERVICE_CARDS = [
  {
    key: 'nutrition',
    title: 'Nutrition',
    subtitle: 'Profile and meal strategy',
    description: 'Open and manage the nutrition profile for this client.',
    cta: 'Open Nutrition',
  },
  {
    key: 'mental',
    title: 'Mental Coaching',
    subtitle: 'Mindset and consistency support',
    description: 'Mental coaching module for this client.',
    cta: 'Open Mental Coaching',
  },
  {
    key: 'antiDoping',
    title: 'Anti-Doping',
    subtitle: 'Compliance and education',
    description: 'Anti-doping resources for this client.',
    cta: 'Open Anti-Doping',
  },
];

function ClientServices() {
  const { summary, links } = useClientServicesContext();

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Client Services</h1>
          <p className="text-xl text-gray-600">Open the right service for this client</p>
        </section>

        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div>
              <p className="text-gray-600">Client</p>
              <p className="text-2xl font-bold" style={{ color: ACCENT }}>{summary.name}</p>
              <p className="text-sm text-gray-600 mt-1">ID: {summary.id} · Email: {summary.email}</p>
            </div>
            <Link className="react-btn react-btn-ghost" to="/clients">← Back to Clients</Link>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-8 mb-8">
          {SERVICE_CARDS.map((card) => (
            <article
              key={card.key}
              className="relative bg-white rounded-2xl shadow-lg border-2 p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
              style={{ borderColor: '#e5e7eb' }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{card.title}</h2>
                <div className="text-gray-600 mb-4">{card.subtitle}</div>
              </div>

              <p className="text-gray-700 mb-8">{card.description}</p>

              <Link
                className="w-full inline-block text-center text-white py-3 rounded-lg font-semibold transition hover:opacity-90"
                style={{ backgroundColor: ACCENT }}
                to={links[card.key]}
              >
                {card.cta}
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

export default ClientServices;
