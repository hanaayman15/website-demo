import { Link } from 'react-router-dom';
import { useClientPortalHome } from '../hooks/useClientPortalHome';
import ClientPortalNav from '../components/layout/ClientPortalNav';

const ACCENT = '#6eabf2';

const FEATURES = [
  { icon: '🥗', title: 'Personalized Nutrition ', desc: 'Custom meal plans tailored to your sport and body composition.' },
  { icon: '🧠', title: 'Mental Coaching', desc: 'Focus, discipline, stress control, and confidence training.' },
  { icon: '📊', title: 'Progress Tracking', desc: 'Monitor weight, strength, sleep, and mental readiness.' },
  { icon: '💊', title: 'Smart Supplements', desc: 'Safe, science-based supplement recommendations.' },
  { icon: '🧪', title: 'Doping', desc: 'Guidance on banned substances and safe performance strategies.' },
  { icon: '💬', title: 'Consultation', desc: 'One-on-one consultations for personalized athlete support.' },
];

const BENEFITS = [
  ['Personal Dashboard', 'Track your meals, weight, and progress all in one place'],
  ['Custom Meal Plans', 'Tailored nutrition based on your sport and goals'],
  ['Direct Coach Access', 'Message your nutritionist anytime with questions'],
  ['Weekly Check-ins', 'Regular progress reviews and plan adjustments'],
  ['Recipe Library', 'Access to performance-focused meal recipes'],
  ['Supplement Guidance', 'Science-backed recommendations for your needs'],
  ['Doping Education', 'Clear guidance on banned substances and safer alternatives'],
  ['Consultation Sessions', 'Regular one-on-one consultations to fine-tune your plan'],
];

const RECIPES = [
  { key: 'steak', img: '/images/steak.jpg', name: 'Steak Power Plate', cal: '520', protein: '38', serving: '460' },
  { key: 'salmon', img: '/images/pexels-crysnet-12431192.jpg', name: 'Grilled Salmon Plate', cal: '580', protein: '45', serving: '430' },
  { key: 'smoothie', img: '/images/pexels-janetrangdoan-1099680.jpg', name: 'Recovery Smoothie Bowl', cal: '380', protein: '28', serving: '350' },
];

const TESTIMONIALS = [
  { stars: 'â­â­â­â­â­', text: '"Best nutrition guidance I\'ve ever received. My performance has improved dramatically!"', author: '- Ahmed M., Footballer' },
  { stars: 'â­â­â­â­â­', text: '"The meal plans are easy to follow and the results speak for themselves."', author: '- Sara K., Swimmer' },
  { stars: 'â­â­â­â­â­', text: '"Finally reached my goal weight while maintaining strength. Highly recommend!"', author: '- Omar T., Runner' },
];

function ClientHome() {
  const { state } = useClientPortalHome({ requireAuth: false });
  const s = state.summary;
  const recipesDestination = state.isAuthenticated ? '/client-recipes' : '/subscription-plan?upgrade=recipes';
  const recipeDetailDestination = (recipeKey) => (
    state.isAuthenticated
      ? `/client-recipes?recipe=${encodeURIComponent(recipeKey)}`
      : '/subscription-plan?upgrade=recipes'
  );

  return (
    <div className="bg-gray-50 text-gray-800 font-sans leading-normal">
      <ClientPortalNav activePath="/client-home" isLoggedIn={state.isAuthenticated} />

      {/* Hero */}
      <header
        className="py-24"
        style={{
          backgroundImage: 'url(/images/pexels-jplenio-1103970.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', zIndex: 1 }} />
        <div className="container mx-auto px-6 text-center" style={{ position: 'relative', zIndex: 2 }}>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
            Elevate Your <span style={{ color: ACCENT }}>Game</span>
          </h1>
          <p className="text-2xl text-gray-700 font-medium mb-4 text-center">Personalized Nutrition &amp; Mental Coaching for Athletes Who Want More</p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 text-center">We help athletes optimize performance through customized nutrition plans, mental training, and science-backed supplementation.</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/client-signup" className="text-white px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition" style={{ backgroundColor: ACCENT }}>Get Started</Link>
            <Link to="/client-login" className="bg-white px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition" style={{ border: `2px solid ${ACCENT}`, color: ACCENT }}>Client Login</Link>
          </div>
        </div>
      </header>

      {/* Personalized snapshot (only if authenticated) */}
      {state.isAuthenticated && (
        <section className="py-12 bg-white border-b border-gray-100">
          <div className="container mx-auto px-6">
            <div className="flex items-start justify-between flex-wrap gap-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Personalized Snapshot</p>
                <h2 className="text-3xl font-bold text-gray-900 mt-1">Welcome, <span style={{ color: ACCENT }}>{s.fullName || 'Athlete'}</span></h2>
                <p className="text-gray-600 mt-2">Your current plan, consultation, and focus recommendations.</p>
              </div>
              <Link to="/client-dashboard" className="px-5 py-3 rounded-xl text-white font-semibold" style={{ backgroundColor: ACCENT }}>Open Dashboard</Link>
            </div>
            <div className="grid md:grid-cols-4 gap-4 mt-8">
              {[
                { label: 'Current Weight', val: s.currentWeight ? `${s.currentWeight} kg` : '--' },
                { label: 'Target Weight', val: s.targetWeight ? `${s.targetWeight} kg` : '--' },
                { label: 'Calories Target', val: s.caloriesTarget ? `${s.caloriesTarget} kcal` : '--' },
                { label: 'Subscription Plan', val: s.subscriptionPlan || '--' },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{item.val}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Feature Grid */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">Train Smarter. Perform Stronger.</h2>
            <div className="w-20 h-1 mx-auto mt-4 rounded-full" style={{ backgroundColor: ACCENT }} />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-md transition">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-xl mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What You Get as a Client</h2>
            <p className="text-gray-500 mt-2 text-center">Everything you need to reach your athletic goals</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {BENEFITS.map(([title, desc]) => (
              <div key={title} className="flex gap-4">
                <div className="text-3xl">✅</div>
                <div>
                  <h4 className="font-bold text-lg mb-2">{title}</h4>
                  <p className="text-gray-600 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recipes */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Performance Recipes</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {RECIPES.map((r) => (
              <div key={r.key} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition">
                <img src={r.img} className="w-full h-48 object-cover" alt={r.name} />
                <div className="p-6">
                  <h4 className="font-bold text-xl mb-2">{r.name}</h4>
                  <div className="flex justify-between text-sm text-gray-500 mb-4">
                    <span>🔥 {r.cal} Cal</span>
                    <span>💪 {r.protein}g Protein</span>
                  </div>
                  <div className="text-sm text-gray-500 mb-4">⚖️ {r.serving}g serving</div>
                  <Link to={recipeDetailDestination(r.key)} className="block w-full py-2 rounded-xl text-center font-bold hover:opacity-90 transition" style={{ border: `1px solid ${ACCENT}`, color: ACCENT }}>
                    View Recipe
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to={recipesDestination} className="font-bold hover:underline" style={{ color: ACCENT }}>View All Recipes </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Trusted by Athletes Like You</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {TESTIMONIALS.map((t) => (
              <div key={t.author} className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="text-4xl mb-4">⭐⭐⭐⭐⭐</div>
                <p className="text-gray-600 italic mb-4">{t.text}</p>
                <p className="font-bold">{t.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="rounded-3xl p-12 text-center border border-gray-100" style={{ background: 'linear-gradient(to bottom right, #dbeafe, #fff)' }}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Elevate Your Performance?</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">Join hundreds of athletes who have taken their nutrition to the next level.</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link to="/client-signup" className="text-white px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition" style={{ backgroundColor: ACCENT }}>Create Account</Link>
              <Link to="/client-login" className="bg-white px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition" style={{ border: `2px solid ${ACCENT}`, color: ACCENT }}>Already a Client? Login</Link>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}

export default ClientHome;
