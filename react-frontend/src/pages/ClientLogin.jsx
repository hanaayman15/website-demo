import { Link, useNavigate } from 'react-router-dom';
import { useClientLogin } from '../hooks/useClientLogin';

function ClientLogin() {
  const navigate = useNavigate();
  const { form, loading, error, success, canSubmit, updateField, submit } = useClientLogin();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Nav */}
      <nav className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900 transition p-2 hover:bg-gray-100 rounded-lg"
            >
              ← Back
            </button>
            <div className="text-2xl font-bold" style={{ color: '#6eabf2' }}>Client Nutrition Portal</div>
          </div>
          <div className="space-x-6 hidden md:block">
            <Link to="/client-home" className="text-gray-600 hover:text-gray-900">Home</Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-900">About</Link>
            <Link to="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
            <Link to="/resources" className="text-gray-600 hover:text-gray-900">Our Clinic</Link>
            <Link to="/success-stories" className="text-gray-600 hover:text-gray-900">Success Stories</Link>
            <Link to="/contact" className="text-gray-600 hover:text-gray-900">Contact Us</Link>
            <Link to="/client-signup" className="font-semibold" style={{ color: '#6eabf2' }}>Sign Up</Link>
          </div>
        </div>
      </nav>

      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-stretch">

          {/* Left – Login Form */}
          <div className="bg-white rounded-3xl shadow-xl p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back! 👋</h1>
              <p className="text-gray-600">Login to access your nutrition dashboard</p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border p-4 border-red-200 bg-red-50 text-red-800">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-6 rounded-xl border p-4 border-emerald-200 bg-emerald-50 text-emerald-800">
                <p className="text-sm font-medium">{success}</p>
              </div>
            )}

            <form onSubmit={submit} noValidate>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                  placeholder="your.email@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.rememberMe}
                    onChange={(e) => updateField('rememberMe', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm font-semibold hover:underline" style={{ color: '#6eabf2' }}>
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full text-white py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#6eabf2' }}
              >
                {loading ? 'Signing in...' : 'Login to Dashboard'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/client-signup" className="font-bold hover:underline" style={{ color: '#6eabf2' }}>Sign Up</Link>
              </p>
              <p className="text-gray-500 text-sm mt-3">
                Doctor/Admin access?{' '}
                <Link to="/doctor-auth" className="font-semibold hover:underline" style={{ color: '#6eabf2' }}>Open Team Management Login</Link>
              </p>
            </div>

            {/* Demo accounts */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Demo Accounts</span>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-gray-700 mb-2"><strong>🏃 Demo Client:</strong></p>
                  <p className="text-xs text-gray-600">Email: demo@client.com</p>
                  <p className="text-xs text-gray-600">Password: demo123</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-sm text-gray-700 mb-2"><strong>👨‍💼 Demo Admin:</strong></p>
                  <p className="text-xs text-gray-600">Email: admin@demo.com</p>
                  <p className="text-xs text-gray-600">Password: admin123</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right – Info Panel */}
          <div
            className="rounded-3xl shadow-xl p-10 text-white flex flex-col justify-center"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4  text-white">Your Nutrition Journey Awaits</h2>
              <p className="leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Access your personalized meal plans, track your progress, and stay connected with your nutrition coach.
              </p>
            </div>

            <div className="space-y-6">
              {[
                { icon: '📊', title: 'Track Your Progress', desc: 'Monitor weight, body composition, and performance metrics' },
                { icon: '🥗', title: 'Custom Meal Plans', desc: 'Get daily nutrition guidance tailored to your goals' },
                { icon: '💬', title: 'Coach Support', desc: 'Message your nutritionist anytime with questions' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-white">{item.title}</h4>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <p className="text-sm italic" style={{ color: 'rgba(255,255,255,0.7)' }}>
                "This portal has completely transformed how I manage my nutrition and athletic performance!"
              </p>
              <p className="text-sm font-semibold mt-2">- Ahmed M., Professional Athlete</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ClientLogin;
