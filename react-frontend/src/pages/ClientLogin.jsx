import { Link } from 'react-router-dom';
import { useClientLogin } from '../hooks/useClientLogin';
import '../assets/styles/react-pages.css';

function ClientLogin() {
  const { form, loading, error, success, canSubmit, updateField, submit } = useClientLogin();

  return (
    <main className="react-page-wrap">
      <section className="react-panel" style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ marginTop: 0 }}>Client Login</h1>
        <p>Sign in to access your nutrition dashboard.</p>

        {error ? <div className="react-alert react-alert-error">{error}</div> : null}
        {success ? <div className="react-alert react-alert-success">{success}</div> : null}

        <form onSubmit={submit} className="react-grid" noValidate>
          <label>
            <span className="react-label">Email</span>
            <input
              className="react-input"
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span className="react-label">Password</span>
            <input
              className="react-input"
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={form.rememberMe}
              onChange={(event) => updateField('rememberMe', event.target.checked)}
            />
            <span>Remember me</span>
          </label>

          <button className="react-btn" type="submit" disabled={!canSubmit}>
            {loading ? 'Signing in...' : 'Login to Dashboard'}
          </button>
        </form>

        <p style={{ marginTop: '1rem' }}>
          No account yet? <Link to="/client-signup">Sign Up</Link>
        </p>
      </section>
    </main>
  );
}

export default ClientLogin;
