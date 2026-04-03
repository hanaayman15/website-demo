import { Link } from 'react-router-dom';
import SiteNav from '../components/layout/SiteNav';

const ACCENT = '#6eabf2';

const TECH_ITEMS = [
  { icon: '💧', title: 'Hydrotherapy', desc: 'Therapeutic water treatments to enhance recovery, reduce inflammation, and improve circulation.' },
  { icon: '⚖️', title: 'InBody™ Analysis', desc: 'Medical-grade tracking of muscle mass, body fat, and hydration.' },
  { icon: '🫀', title: 'Metabolic Testing', desc: 'Identify your exact Resting Metabolic Rate (RMR) for precise fueling.' },
  { icon: '🏥', title: 'Physiotherapy', desc: 'Evidence-based physical rehabilitation to optimize movement, prevent injury, and support athletic performance.' },
  { icon: '🧠', title: 'Mental Session', desc: 'One-on-one psychological support focused on mental resilience, stress management, and performance mindset.' },
  { icon: '📈', title: 'Performance Tracking', desc: 'Comprehensive analytics to monitor your progress and optimize training outcomes.' },
];

function Resources() {
  return (
    <div className="bg-gray-50 text-gray-800 font-sans leading-normal">
      <SiteNav activePath="/resources" />

      {/* Hero */}
      <header
        className="py-16"
        style={{
          backgroundImage: 'url(/images/pexels-jplenio-1103970.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.92)', zIndex: 1 }} />
        <div className="container mx-auto px-6 text-center" style={{ position: 'relative', zIndex: 2 }}>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            A Space Designed for <span style={{ color: ACCENT }}>Healing.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Visit our state-of-the-art facility where science meets comfort to provide you with the best nutritional care.
          </p>
        </div>
      </header>

      {/* First Visit */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <img
                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80"
                alt="Clinic Interior"
                className="rounded-2xl shadow-xl"
              />
            </div>
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Your First Visit</h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Our clinic provides a serene and private environment. From private consultation rooms to our nutritional resource library, every detail is crafted for your success.
              </p>
              <ul className="space-y-4">
                {['Private Consultation Rooms', 'Dedicated Metabolic Testing Lab', 'Comfortable Patient Lounge'].map((item) => (
                  <li key={item} className="flex items-center text-gray-700 font-medium">
                    <span className="p-1 rounded-full mr-3" style={{ backgroundColor: '#f0f8ff', color: ACCENT }}>✔</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Technology */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Clinical Technology</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
            {TECH_ITEMS.map((item) => (
              <div key={item.title} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="mb-4 text-3xl" style={{ color: ACCENT }}>{item.icon}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ backgroundColor: ACCENT }}>
        <div className="container mx-auto px-6 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Book Your First Consultation</h2>
          <p className="mb-8 text-lg" style={{ opacity: 0.9 }}>Experience personalized nutritional care in a professional clinical setting.</p>
          <Link to="/client-signup" className="bg-white font-bold py-4 px-10 rounded-full shadow-lg hover:bg-gray-100 transition inline-block" style={{ color: ACCENT }}>
            Schedule Now
          </Link>
        </div>
      </section>

      <footer className="py-8 text-center text-gray-500 text-sm border-t border-gray-200 bg-white">
        &copy; 2026 VitalityPath Nutrition Management. All rights reserved.
      </footer>
    </div>
  );
}

export default Resources;
