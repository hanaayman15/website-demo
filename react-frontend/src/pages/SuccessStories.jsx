import { Link } from 'react-router-dom';
import SiteNav from '../components/layout/SiteNav';

const ACCENT = '#6eabf2';
const STORY_IMAGES = [
  '/images/Screenshot 2026-02-25 043458.png',
  '/images/Screenshot 2026-02-25 044900.png',
  '/images/Screenshot 2026-02-25 044915.png',
  '/images/Screenshot 2026-02-25 044930.png',
  '/images/Screenshot 2026-02-25 044945.png',
  '/images/Screenshot 2026-02-25 045003.png',
  '/images/Screenshot 2026-02-25 045021.png',
  '/images/Screenshot 2026-02-25 045033.png',
  '/images/Screenshot 2026-02-25 045044.png',
];

function SuccessStories() {
  return (
    <div className="bg-gray-50 text-gray-800 font-sans leading-normal">
      <SiteNav activePath="/success-stories" />
      <header className="py-16" style={{ backgroundImage: 'url(/images/pexels-jplenio-1103970.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.92)', zIndex: 1 }} />
        <div className="container mx-auto px-6 text-center" style={{ position: 'relative', zIndex: 2 }}>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Real Commitment. <span style={{ color: ACCENT }}>Real Results.</span></h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto text-center">Discover the inspiring journeys of our clients who redefined their health and reclaimed their vitality through personalized nutrition.</p>
        </div>
      </header>
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {STORY_IMAGES.map((img, idx) => (
              <div key={idx} className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow p-4">
                <img src={img} alt={`Success story ${idx + 1}`} className="w-full h-auto rounded-2xl object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16" style={{ backgroundColor: ACCENT }}>
        <div className="container mx-auto px-6 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Be our next success story.</h2>
          <p className="mb-8 text-lg text-center" style={{ opacity: 0.9 }}>Start your journey toward a healthier, more vibrant you today.</p>
          <Link to="/client-signup" className="bg-white font-bold py-4 px-10 rounded-full shadow-lg hover:bg-gray-100 transition inline-block" style={{ color: ACCENT }}>Book a Consultation</Link>
        </div>
      </section>
      
    </div>
  );
}

export default SuccessStories;
