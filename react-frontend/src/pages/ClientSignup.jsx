import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientSignup } from '../hooks/useClientSignup';
import SiteNav from '../components/layout/SiteNav';

const ACCENT = '#6eabf2';

function ClientSignup() {
  const navigate = useNavigate();
  const { state, countryOptions, sportOptions, updateField, submitSignup } = useClientSignup();

  useEffect(() => {
    sessionStorage.setItem('portalType', 'client');
  }, []);

  useEffect(() => {
    if (!state.success) return;
    const currentClientId = String(localStorage.getItem('currentClientId') || '').trim();
    const params = new URLSearchParams({ flow: 'signup' });
    if (currentClientId) params.set('client_id', currentClientId);
    const timeout = window.setTimeout(() => navigate(`/subscription-plan?${params.toString()}`), 1200);
    return () => window.clearTimeout(timeout);
  }, [navigate, state.success]);

  const onSubmit = async (event) => {
    event.preventDefault();
    await submitSignup();
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <SiteNav activePath="/client-signup" />

      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-stretch">
          {/* Gradient Panel */}
          <div className="rounded-3xl shadow-xl p-10 text-white flex flex-col justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4 text-center text-white">Start Your Transformation Today 🚀</h2>
              <p className="text-white/90 leading-relaxed">Join hundreds of athletes who have elevated their performance through personalized nutrition coaching.</p>
            </div>

            <div className="space-y-6">
              {['Personalized meal plans designed for your sport', 'Real-time progress tracking & analytics', 'Direct access to certified nutritionists', 'Mental performance coaching included', 'Science-backed supplement recommendations'].map((item) => (
                <div key={item} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">✓</div>
                  <p className="text-white/90">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <div className="text-4xl mb-2">⭐⭐⭐⭐⭐</div>
              <p className="text-sm text-white/70 italic">"Best decision I made for my athletic career. The personalized approach really works!"</p>
              <p className="text-sm font-semibold mt-2">- Sara K., Professional Swimmer</p>
            </div>
          </div>

          {/* Form Panel */}
          <div className="bg-white rounded-3xl shadow-xl p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
              <p className="text-gray-600">Start your journey to peak performance</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              {state.error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">{state.error}</div>}
              {state.success && <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">✓ {state.success}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">First Name</label>
                  <input type="text" value={state.form.firstName} onChange={(e) => updateField('firstName', e.target.value)} placeholder="John" required className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Last Name</label>
                  <input type="text" value={state.form.lastName} onChange={(e) => updateField('lastName', e.target.value)} placeholder="Doe" required className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Email Address</label>
                <input type="email" value={state.form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="your.email@example.com" required className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Country</label>
                  <select value={state.form.country} onChange={(e) => updateField('country', e.target.value)} className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none">
                    <option value="">Select country</option>
                    {countryOptions.map((item) => (<option key={item.country} value={item.country}>{item.country}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Phone</label>
                  <input type="tel" value={state.form.phone} onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, ''))} placeholder="Local number" className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Sport</label>
                <select value={state.form.sport} onChange={(e) => updateField('sport', e.target.value)} required className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none">
                  <option value="">Select your sport</option>
                  {sportOptions.map((sport) => (<option key={sport} value={sport}>{sport}</option>))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Password</label>
                  <input type="password" value={state.form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="Minimum 6 characters" required className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Confirm</label>
                  <input type="password" value={state.form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} placeholder="Re-enter password" required className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none" />
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input type="checkbox" checked={state.form.termsAccepted} onChange={(e) => updateField('termsAccepted', e.target.checked)} required className="w-4 h-4" />
                I agree to the Terms of Service and Privacy Policy.
              </label>

              <button type="submit" disabled={state.submitting} className="w-full py-4 rounded-xl font-bold text-white transition" style={{ backgroundColor: ACCENT }}>
                {state.submitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientSignup;
