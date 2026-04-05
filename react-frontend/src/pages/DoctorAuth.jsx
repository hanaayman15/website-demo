import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function DoctorAuth() {
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next') || '/';
  const { state, canSubmit, setTab, updateField, submit } = useAuth(nextPath);

  const loginForm = state.loginForm;
  const signupForm = state.signupForm;
  const adminForm = state.adminForm;

  return (
    <div className="bg-gray-50 min-h-screen">
      <nav className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-600 hover:text-gray-900 transition p-2 hover:bg-gray-100 rounded-lg">
              ← Back to Home
            </Link>
            <div className="text-2xl font-bold" style={{ color: '#6eabf2' }}>Team Management Access</div>
          </div>
          <div className="hidden md:flex items-center gap-6 whitespace-nowrap">
            <Link to="/client-login" className="text-gray-600 hover:text-gray-900">Client Login</Link>
            <Link to="/client-signup" className="text-gray-600 hover:text-gray-900">Client Sign Up</Link>
          </div>
        </div>
      </nav>

      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-stretch">
          <div className="bg-white rounded-3xl shadow-xl p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor/Admin Access</h1>
              <p className="text-gray-600">Sign in or sign up to continue to team management pages</p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6 p-1 rounded-xl bg-gray-100">
              <button
                type="button"
                className={`py-2 rounded-lg text-sm font-semibold transition ${state.activeTab === 'login' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}
                onClick={() => setTab('login')}
              >
                Doctor Login
              </button>
              <button
                type="button"
                className={`py-2 rounded-lg text-sm font-semibold transition ${state.activeTab === 'signup' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}
                onClick={() => setTab('signup')}
              >
                Doctor Sign Up
              </button>
              <button
                type="button"
                className={`py-2 rounded-lg text-sm font-semibold transition ${state.activeTab === 'admin' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}
                onClick={() => setTab('admin')}
              >
                Admin Login
              </button>
            </div>

            {state.error ? (
              <div className="mb-6 rounded-xl border p-4 border-red-200 bg-red-50 text-red-800">
                <p className="text-sm font-medium">{state.error}</p>
              </div>
            ) : null}
            {state.message ? (
              <div className="mb-6 rounded-xl border p-4 border-emerald-200 bg-emerald-50 text-emerald-800">
                <p className="text-sm font-medium">{state.message}</p>
              </div>
            ) : null}

            {state.activeTab === 'login' ? (
              <form onSubmit={(event) => submit('login', event)}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(event) => updateField('loginForm', 'email', event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                    placeholder="admin@demo.com"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => updateField('loginForm', 'password', event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={!canSubmit || state.submitting}
                  className="w-full text-white py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#6eabf2' }}
                >
                  {state.submitting ? 'Please wait...' : 'Login and Continue'}
                </button>
              </form>
            ) : null}

            {state.activeTab === 'signup' ? (
              <form onSubmit={(event) => submit('signup', event)}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    value={signupForm.fullName}
                    onChange={(event) => updateField('signupForm', 'fullName', event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                    placeholder="Doctor full name"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(event) => updateField('signupForm', 'email', event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                    placeholder="doctor@clinic.com"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    minLength={6}
                    value={signupForm.password}
                    onChange={(event) => updateField('signupForm', 'password', event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={!canSubmit || state.submitting}
                  className="w-full text-white py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#6eabf2' }}
                >
                  {state.submitting ? 'Please wait...' : 'Create Doctor Account'}
                </button>
              </form>
            ) : null}

            {state.activeTab === 'admin' ? (
              <form onSubmit={(event) => submit('admin', event)}>
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  Demo Admin: admin@demo.com / admin123
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(event) => updateField('adminForm', 'email', event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                    placeholder="admin@demo.com"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={adminForm.password}
                    onChange={(event) => updateField('adminForm', 'password', event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={!canSubmit || state.submitting}
                  className="w-full text-white py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#6eabf2' }}
                >
                  {state.submitting ? 'Please wait...' : 'Login as Admin'}
                </button>
              </form>
            ) : null}
          </div>

          <div
            className="rounded-3xl shadow-xl p-10 text-white flex flex-col justify-center"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4  text-white">Doctor/Admin Access for Team Management</h2>
              <p className="leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Use this access point to create your doctor account, sign in as doctor, or sign in as admin to continue to management pages.
              </p>
            </div>

            <div className="space-y-4">
              <p>• Doctor sign up creates a doctor role account.</p>
              <p>• Doctor login sends you straight to the team builder.</p>
              <p>• Admin login opens full management access.</p>
              <p>• Team ownership is tied to the logged-in doctor.</p>
            </div>

            <div className="mt-8 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <p className="text-sm italic" style={{ color: 'rgba(255,255,255,0.75)' }}>
                "Single place for team admins and doctors, using the same clean auth experience as client login."
              </p>
              <p className="text-sm font-semibold mt-2">- Team Management Portal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorAuth;
