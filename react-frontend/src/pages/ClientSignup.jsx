import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClientSignup } from '../hooks/useClientSignup';
import '../assets/styles/react-pages.css';

const SPORTS = [
  'Football',
  'Basketball',
  'Tennis',
  'Swimming',
  'Running',
  'Cycling',
  'Weightlifting',
  'CrossFit',
  'Volleyball',
  'General Exercise',
  'Other',
];

function ClientSignup() {
  const navigate = useNavigate();
  const { state, countryOptions, updateField, submitSignup } = useClientSignup();

  useEffect(() => {
    sessionStorage.setItem('portalType', 'client');
  }, []);

  useEffect(() => {
    if (!state.success) return;
    const timeout = window.setTimeout(() => navigate('/subscription-plan'), 1200);
    return () => window.clearTimeout(timeout);
  }, [navigate, state.success]);

  const onSubmit = async (event) => {
    event.preventDefault();
    await submitSignup();
  };

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1100, gap: '1rem' }}>
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: '0.35rem' }}>Create Your Client Account</h1>
          <p className="react-muted" style={{ margin: 0 }}>
            Start your transformation journey with personalized nutrition support.
          </p>
        </div>
        <div className="react-inline-actions">
          <Link className="react-btn react-btn-ghost" to="/client-home">Home</Link>
          <Link className="react-btn react-btn-ghost" to="/client-login">Login</Link>
        </div>
      </section>

      <section className="react-grid react-grid-2" style={{ alignItems: 'start' }}>
        <article className="react-panel react-grid" style={{ gap: '0.75rem' }}>
          <h2 style={{ margin: 0 }}>Why Join</h2>
          <p className="react-muted" style={{ margin: 0 }}>
            Personalized meal plans, progress tracking, and direct nutritionist support.
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            <li>Performance-focused nutrition plans</li>
            <li>Goal tracking and dashboard insights</li>
            <li>Mental coaching and supplement guidance</li>
            <li>Athlete-specific recommendations</li>
          </ul>
        </article>

        <form className="react-panel react-grid" style={{ gap: '0.75rem' }} onSubmit={onSubmit}>
          {state.error ? <div className="react-alert react-alert-error">{state.error}</div> : null}
          {state.success ? <div className="react-alert react-alert-success">{state.success}</div> : null}

          <div className="react-grid react-grid-2">
            <label>
              <span className="react-label">First Name</span>
              <input
                className="react-input"
                value={state.form.firstName}
                onChange={(event) => updateField('firstName', event.target.value)}
                placeholder="John"
              />
            </label>
            <label>
              <span className="react-label">Last Name</span>
              <input
                className="react-input"
                value={state.form.lastName}
                onChange={(event) => updateField('lastName', event.target.value)}
                placeholder="Doe"
              />
            </label>
          </div>

          <label>
            <span className="react-label">Email</span>
            <input
              className="react-input"
              type="email"
              value={state.form.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="your.email@example.com"
            />
          </label>

          <div className="react-grid react-grid-2">
            <label>
              <span className="react-label">Country</span>
              <select
                className="react-input"
                value={state.form.country}
                onChange={(event) => updateField('country', event.target.value)}
              >
                {countryOptions.map((item) => (
                  <option key={item.country} value={item.country}>{item.country} ({item.dialCode})</option>
                ))}
              </select>
            </label>
            <label>
              <span className="react-label">Phone</span>
              <input
                className="react-input"
                value={state.form.phone}
                onChange={(event) => updateField('phone', event.target.value.replace(/\D/g, ''))}
                placeholder="Local number"
              />
            </label>
          </div>

          <label>
            <span className="react-label">Sport</span>
            <select
              className="react-input"
              value={state.form.sport}
              onChange={(event) => updateField('sport', event.target.value)}
            >
              <option value="">Select your sport</option>
              {SPORTS.map((sport) => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </label>

          <div className="react-grid react-grid-2">
            <label>
              <span className="react-label">Password</span>
              <input
                className="react-input"
                type="password"
                value={state.form.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder="Minimum 6 characters"
              />
            </label>
            <label>
              <span className="react-label">Confirm Password</span>
              <input
                className="react-input"
                type="password"
                value={state.form.confirmPassword}
                onChange={(event) => updateField('confirmPassword', event.target.value)}
                placeholder="Re-enter password"
              />
            </label>
          </div>

          <label className="react-inline-toggle">
            <input
              type="checkbox"
              checked={state.form.termsAccepted}
              onChange={(event) => updateField('termsAccepted', event.target.checked)}
            />
            <span>I agree to the Terms of Service and Privacy Policy.</span>
          </label>

          <button className="react-btn" type="submit" disabled={state.submitting}>
            {state.submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default ClientSignup;
