import { Link } from 'react-router-dom';
import SiteNav from '../components/layout/SiteNav';

const ACCENT = '#6eabf2';

const FEATURE_CARDS = [
  { icon: '🧞', title: 'Mental Resilience Coach', desc: 'Overcome emotional eating and plateaus with cognitive behavioral tools, daily mindset prompts, and stress-management techniques designed by sports psychologists.' },
  { icon: '🍱', title: 'Meal Planning Software', desc: 'Precision-engineered meal plans that calculate macros and micronutrients automatically based on your specific clinical requirements.' },
  { icon: '🍳', title: 'Advanced Recipe Management', desc: 'Scale recipes effortlessly. Adjust portion sizes while maintaining the perfect nutritional balance for your daily targets.' },
  { icon: '📅', title: 'Calendar & Reminders', desc: 'Integrated calendar for appointments, bi-weekly check-ins, and automated meal reminders pushed directly to your device.' },
  { icon: '📊', title: 'Automated Reports', desc: 'Receive weekly progress reports and physiological templates that visualize your metabolic improvements over time.' },
  { icon: '📖', title: 'Recipes Database', desc: 'Access a curated library of over 1,000+ dietitian-approved recipes filtered by allergy, dietary preference, and prep time.' },
  { icon: '💬', title: 'Consultation', desc: 'Book focused one-on-one consultations to review progress, adjust nutrition strategy, and align plans with your training schedule.' },
  { icon: '🧪', title: 'Doping Awareness', desc: 'Stay safe with practical anti-doping guidance, supplement screening principles, and education on banned substance risks.' },
  { icon: '📈', title: 'Progress Tracking', desc: 'Monitor your journey with comprehensive tracking tools including body measurements, performance metrics, and detailed analytics.' },
];

function Features() {
  return (
    <div className="bg-gray-50 text-gray-800 font-sans leading-normal">
      <SiteNav activePath="/features" />

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
            Integrated <span style={{ color: ACCENT }}>Performance Tools.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto text-center">
            From clinical meal planning to mental resilience coaching, we provide the full ecosystem for permanent health transformation.
          </p>
        </div>
      </header>

      {/* Feature Cards */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {FEATURE_CARDS.map((card, i) => (
              <div
                key={card.title}
                className={`p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 ${i === 0 ? 'border-2' : 'bg-white border border-gray-100'}`}
                style={i === 0 ? { backgroundColor: '#f0f8ff', borderColor: '#d4e8f5' } : {}}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm"
                  style={{ backgroundColor: i === 0 ? '#fff' : '#f0f8ff', color: ACCENT }}
                >
                  {card.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{card.title}</h3>
                <p className="text-gray-600 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mindset Banner */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6">
          <div className="bg-gray-900 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between shadow-2xl">
            <div className="md:w-2/3 mb-8 md:mb-0">
              <h2 className="text-white text-3xl font-bold mb-4">Mindset is 80% of the Battle</h2>
              <p className="text-gray-400 text-lg">Our mental coaching module uses habit-stacking science to ensure your new nutrition plan becomes a permanent lifestyle, not just a temporary diet.</p>
            </div>
            <div className="md:w-1/3 flex justify-center md:justify-end">
              <div className="text-6xl">🧠✨</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ backgroundColor: ACCENT }}>
        <div className="container mx-auto px-6 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to simplify your nutrition?</h2>
          <p className="mb-8 text-lg text-center" style={{ opacity: 0.9 }}>Our technology takes the guesswork out of eating healthy.</p>
          <Link to="/client-signup" className="bg-white font-bold py-4 px-10 rounded-full shadow-lg hover:bg-gray-100 transition inline-block" style={{ color: ACCENT }}>
            Get Started Now
          </Link>
        </div>
      </section>

  
    </div>
  );
}

export default Features;
