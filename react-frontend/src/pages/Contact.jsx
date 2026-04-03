import { useState } from 'react';
import SiteNav from '../components/layout/SiteNav';

const ACCENT = '#6eabf2';
const REASONS = ['Weight Management', 'Medical Nutrition Therapy', 'Sports Performance', 'General Inquiry'];

function Contact() {
  const [form, setForm] = useState({ name: '', email: '', reason: REASONS[0], message: '' });
  const [status, setStatus] = useState('');

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus('error');
      return;
    }
    setStatus('success');
    setForm({ name: '', email: '', reason: REASONS[0], message: '' });
  };

  return (
    <div className="bg-gray-50 text-gray-800 font-sans leading-normal">
      <SiteNav activePath="/contact" />

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
            Get in <span style={{ color: ACCENT }}>Touch.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto text-center">
            Have questions? We're here to help. Reach out and our clinical team will respond within 24 hours.
          </p>
        </div>
      </header>

      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap -mx-6">
            {/* Form */}
            <div className="w-full lg:w-2/3 px-6 mb-12">
              <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
                {status === 'success' && (
                  <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
                    ✅ Message sent! Our team will contact you soon.
                  </div>
                )}
                {status === 'error' && (
                  <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
                    Please complete all fields before sending.
                  </div>
                )}
                <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Full Name</label>
                    <input
                      type="text" value={form.name} onChange={(e) => update('name', e.target.value)}
                      placeholder="Jane Doe" required
                      className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Email Address</label>
                    <input
                      type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                      placeholder="jane@example.com" required
                      className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none transition"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Reason for Inquiry</label>
                    <select
                      value={form.reason} onChange={(e) => update('reason', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none"
                    >
                      {REASONS.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Message</label>
                    <textarea
                      rows={5} value={form.message} onChange={(e) => update('message', e.target.value)}
                      placeholder="Tell us about your goals..." required
                      className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none transition"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className="text-white font-bold py-3 px-10 rounded-full shadow-lg hover:opacity-90 transition"
                      style={{ backgroundColor: ACCENT }}
                    >
                      Send Message
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar info */}
            <div className="w-full lg:w-1/3 px-6">
              <div className="space-y-8">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2 italic">Direct Contact</h4>
                  <p className="text-gray-600 flex items-center"><span className="mr-3">📧</span> MohamedAlaa2864@gmail.com</p>
                  <p className="text-gray-600 flex items-center mt-2"><span className="mr-3">📞</span> +20 155 018 8581</p>
                </div>
                <div className="p-6 rounded-2xl text-white shadow-lg" style={{ backgroundColor: ACCENT }}>
                  <h4 className="text-lg font-bold mb-4 flex items-center"><span className="mr-2">🕒</span> Office Hours</h4>
                  <ul className="space-y-2 text-sm" style={{ opacity: 0.9 }}>
                    <li className="flex justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}><span>Mon - Thu:</span><span>8am - 6pm</span></li>
                    <li className="flex justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}><span>Friday:</span><span>8am - 4pm</span></li>
                    <li className="flex justify-between"><span>Sat - Sun:</span><span className="font-bold">Closed</span></li>
                  </ul>
                </div>
                <div className="flex gap-4">
                  <a href="https://wa.me/201550188581" className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow" style={{ backgroundColor: '#25D366' }}>💬</a>
                  <a href="mailto:MohamedAlaa2864@gmail.com" className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow" style={{ backgroundColor: ACCENT }}>✉️</a>
                  <a href="https://www.instagram.com/dr.mohamed.alaa/" className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow" style={{ background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }}>📸</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      
   
    </div>
  );
}

export default Contact;
