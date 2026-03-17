import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../assets/styles/react-pages.css';

function DoctorAuth() {
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next') || '/doctor-dashboard';
  const { state, canSubmit, setTab, updateField, submit } = useAuth(nextPath);

  const loginForm = state.loginForm;
  const signupForm = state.signupForm;
  const adminForm = state.adminForm;

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 980, gap: '1rem' }}>
      <section className="react-panel react-grid" style={{ background: 'linear-gradient(135deg, #19416f, #276fb0)', color: '#fff' }}>
        <h1 style={{ margin: 0 }}>Doctor/Admin Access</h1>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)' }}>
          Create a doctor account, sign in as doctor, or sign in as admin to manage teams.
        </p>
        <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'rgba(255,255,255,0.92)' }}>
          <li>Doctor sign up creates a dedicated doctor role account.</li>
          <li>Doctor login sends you directly to team-management views.</li>
          <li>Admin login unlocks full management access.</li>
        </ul>
      </section>

      <section className="react-panel react-grid">
        <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
          <Link className="react-btn react-btn-ghost" to="/">Back to Home</Link>
          <div className="react-inline-actions">
            <button
              className={`react-day-tab ${state.activeTab === 'login' ? 'active' : ''}`}
              type="button"
              onClick={() => setTab('login')}
            >
              Doctor Login
            </button>
            <button
              className={`react-day-tab ${state.activeTab === 'signup' ? 'active' : ''}`}
              type="button"
              onClick={() => setTab('signup')}
            >
              Doctor Sign Up
            </button>
            <button
              className={`react-day-tab ${state.activeTab === 'admin' ? 'active' : ''}`}
              type="button"
              onClick={() => setTab('admin')}
            >
              Admin Login
            </button>
          </div>
        </div>

        {state.error ? <div className="react-alert react-alert-error">{state.error}</div> : null}
        {state.message ? <div className="react-alert react-alert-success">{state.message}</div> : null}

        {state.activeTab === 'login' ? (
          <form className="react-grid" onSubmit={(event) => submit('login', event)}>
            <h2 style={{ margin: 0 }}>Doctor Login</h2>
            <label>
              <span className="react-label">Email</span>
              <input
                className="react-input"
                type="email"
                value={loginForm.email}
                onChange={(event) => updateField('loginForm', 'email', event.target.value)}
                required
              />
            </label>
            <label>
              <span className="react-label">Password</span>
              <input
                className="react-input"
                type="password"
                value={loginForm.password}
                onChange={(event) => updateField('loginForm', 'password', event.target.value)}
                required
              />
            </label>
            <button className="react-btn" type="submit" disabled={!canSubmit || state.submitting}>
              {state.submitting ? 'Please wait...' : 'Login and Continue'}
            </button>
          </form>
        ) : null}

        {state.activeTab === 'signup' ? (
          <form className="react-grid" onSubmit={(event) => submit('signup', event)}>
            <h2 style={{ margin: 0 }}>Doctor Sign Up</h2>
            <label>
              <span className="react-label">Full Name</span>
              <input
                className="react-input"
                value={signupForm.fullName}
                onChange={(event) => updateField('signupForm', 'fullName', event.target.value)}
                required
              />
            </label>
            <label>
              <span className="react-label">Email</span>
              <input
                className="react-input"
                type="email"
                value={signupForm.email}
                onChange={(event) => updateField('signupForm', 'email', event.target.value)}
                required
              />
            </label>
            <label>
              <span className="react-label">Password</span>
              <input
                className="react-input"
                type="password"
                minLength={6}
                value={signupForm.password}
                onChange={(event) => updateField('signupForm', 'password', event.target.value)}
                required
              />
            </label>
            <button className="react-btn" type="submit" disabled={!canSubmit || state.submitting}>
              {state.submitting ? 'Please wait...' : 'Create Doctor Account'}
            </button>
          </form>
        ) : null}

        {state.activeTab === 'admin' ? (
          <form className="react-grid" onSubmit={(event) => submit('admin', event)}>
            <h2 style={{ margin: 0 }}>Admin Login</h2>
            <div className="react-alert" style={{ background: '#f8fafc', border: '1px solid #d1d5db' }}>
              Demo Admin: admin@demo.com / admin123
            </div>
            <label>
              <span className="react-label">Email</span>
              <input
                className="react-input"
                type="email"
                value={adminForm.email}
                onChange={(event) => updateField('adminForm', 'email', event.target.value)}
                required
              />
            </label>
            <label>
              <span className="react-label">Password</span>
              <input
                className="react-input"
                type="password"
                value={adminForm.password}
                onChange={(event) => updateField('adminForm', 'password', event.target.value)}
                required
              />
            </label>
            <button className="react-btn" type="submit" disabled={!canSubmit || state.submitting}>
              {state.submitting ? 'Please wait...' : 'Login as Admin'}
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}

export default DoctorAuth;
