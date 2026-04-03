import { Link, useNavigate } from 'react-router-dom';

const ACCENT = '#6eabf2';

function About() {
  const navigate = useNavigate();

  const qa = [
    {
      q: 'Should I focus on fat loss or weight loss?',
      a: 'Understanding the difference is key to reaching your fitness goals. Weight can fluctuate for various reasons (water, muscle, etc.), but fat loss is a more gradual and sustainable change.',
    },
    {
      q: 'How much sleep should I be getting?',
      a: 'For athletes, 7-9 hours of quality sleep per night is recommended. Quality matters. To maximize recovery and performance, quality sleep is non-negotiable.',
    },
    {
      q: 'How can I improve my reaction time?',
      a: 'Reaction time improves with consistent sleep, proper hydration, and targeted drills (like ball-drop, sprint-start, or decision-making exercises). Short, focused sessions 2-3 times per week can sharpen speed and accuracy over time.',
    },
  ];

  const tips = [
    { n: '01', title: 'Balance Meals', desc: 'Aim for colorful plates filled with fruits and vegetables for a range of nutrients.' },
    { n: '02', title: 'Stay Active', desc: 'Find activities you enjoy, from walking to dancing, and make them routine.' },
    { n: '03', title: 'Keep Hydrated', desc: 'Carry a water bottle to remind you to function at your best throughout the day.' },
    { n: '04', title: 'Prioritize Sleep', desc: 'Consistent schedules help your body and mind rest and recover properly.' },
  ];

  return (
    <div className="bg-gray-50 text-gray-800 font-sans leading-normal">

      {/* Nav */}
      <nav className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900 transition p-2 hover:bg-gray-100 rounded-lg">
              ← Back
            </button>
            <div className="text-2xl font-bold" style={{ color: ACCENT }}>Client Nutrition Management</div>
          </div>
          <div className="space-x-6 hidden md:block">
            <Link to="/" className="text-black">Home</Link>
            <Link to="/about" className="font-semibold border-b-2" style={{ color: ACCENT, borderColor: ACCENT }}>About</Link>
            <Link to="/features" className="text-black">Features</Link>
            <Link to="/resources" className="text-black">Our Clinic</Link>
            <Link to="/success-stories" className="text-black">Success Stories</Link>
            <Link to="/contact" className="text-black">Contact Us</Link>
            <Link to="/add-client" className="text-white px-4 py-2 rounded-lg transition hover:opacity-90" style={{ backgroundColor: ACCENT }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Header with background image */}
      <header
        className="py-16"
        style={{
          backgroundImage: 'url(/images/pexels-jplenio-1103970.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(255,255,255,0.92)', zIndex: 1,
          }}
        />
        <div className="container mx-auto px-6 text-center" style={{ position: 'relative', zIndex: 2 }}>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Nutrition Powered by Science,{' '}
            <br /><span style={{ color: ACCENT }}>Tailored for Life.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We believe health shouldn't be a guessing game. Our mission is to provide evidence-based nutrition management that fits your unique lifestyle.
          </p>
        </div>
      </header>

      {/* Q&A Section */}
      <section
         className="py-16 bg-cover bg-center"
         style={{ backgroundImage: "url('/images/back.jpg')" }}
       >
        <div className="container mx-auto px-6"></div>
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Q&amp;A of the Day</h2>
            <div className="w-16 h-1 mx-auto mt-4 rounded-full" style={{ backgroundColor: ACCENT }} />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {qa.map((item) => (
              <div key={item.q} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span style={{ color: ACCENT }}>Q:</span> {item.q}
                </h3>
                <p className="text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.a }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Daily Reminder */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto bg-blue-50 p-8 rounded-r-2xl" style={{ borderLeft: `4px solid ${ACCENT}` }}>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: ACCENT }}>Daily Reminder</h4>
            <p className="text-2xl md:text-3xl font-light text-gray-800 italic">
              "If you don't make time for your <strong>wellness</strong>, you will be forced to make time for your <strong>sickness</strong>."
            </p>
          </div>
        </div>
      </section>

      {/* Meet the Expert */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-12 max-w-4xl mx-auto">
            <div className="shrink-0">
              <div className="w-64 h-64 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <img src="/images/dr.mohamed.jpg" alt="Dr. Mohamed Alaa" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Meet Our Lead Expert</h2>
              <h4 className="text-xl font-bold mb-4" style={{ color: ACCENT }}>Dr. Mohamed Alaa</h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">🔹 Performance Nutrition at Smouha Sporting Club</li>
                <li className="flex items-center gap-2">🔹 CASN Level 1 &amp; 2</li>
                <li className="flex items-center gap-2">🔹 Certified Sports Mental Coach</li>
                <li className="flex items-center gap-2">🔹 Clinical Pharmacist</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Simple Tips for Everyday Wellness</h2>
            <p className="text-gray-500 text-center">Small adjustments that lead to lasting benefits.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tips.map((tip) => (
              <div key={tip.n} className="p-6 border border-gray-100 rounded-2xl hover:shadow-lg transition">
                <span className="text-3xl font-black opacity-10 block mb-2">{tip.n}</span>
                <h5 className="font-bold text-lg mb-2">{tip.title}</h5>
                <p className="text-sm text-gray-600">{tip.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center text-gray-500 max-w-2xl mx-auto">
            Adopting a healthier lifestyle doesn't have to be about drastic changes. It's about small, manageable adjustments.{' '}
            <Link to="/client-signup" className="font-bold" style={{ color: ACCENT }}>Start small and celebrate your progress!</Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-12" style={{ backgroundColor: ACCENT }}>
        <div className="container mx-auto px-6 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Unlock Your Peak Performance</h2>
          <p className="mb-8 text-lg text-center" style={{ opacity: 0.9 }}>Join over 500+ clients who have redefined their relationship with food.</p>
          <Link to="/client-signup" className="bg-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition inline-block" style={{ color: ACCENT }}>
            Book a Consultation
          </Link>
        </div>
      </section>

      {/* Footer */}

    </div>
  );
}

export default About;
