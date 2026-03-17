import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileSetup } from '../hooks/useProfileSetup';
import '../assets/styles/react-pages.css';

function ProfileSetup() {
  const navigate = useNavigate();
  const {
    form,
    saving,
    error,
    message,
    canSubmit,
    countries,
    phoneOptions,
    redirectClientId,
    hasDraft,
    updateField,
    runAutofill,
    restoreDraft,
    discardDraft,
    saveBasicInfo,
  } = useProfileSetup();

  useEffect(() => {
    if (!redirectClientId) return;
    const timer = setTimeout(() => {
      navigate(`/client-services?client_id=${encodeURIComponent(redirectClientId)}`);
    }, 600);
    return () => clearTimeout(timer);
  }, [navigate, redirectClientId]);

  return (
    <main className="react-page-wrap react-grid" style={{ gap: '1rem', maxWidth: 900 }}>
      <section className="react-panel">
        <h1 style={{ marginTop: 0, marginBottom: '0.4rem' }}>Profile Setup</h1>
        <p className="react-muted" style={{ margin: 0 }}>Basic Information only</p>
      </section>

      {error ? <div className="react-alert react-alert-error">{error}</div> : null}
      {message ? <div className="react-alert react-alert-success">{message}</div> : null}
      {hasDraft ? (
        <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
          <p className="react-muted" style={{ margin: 0 }}>Saved draft detected for this form.</p>
          <div className="react-inline-actions">
            <button className="react-btn react-btn-ghost" type="button" onClick={restoreDraft}>Restore Draft</button>
            <button className="react-btn react-btn-danger" type="button" onClick={discardDraft}>Discard Draft</button>
          </div>
        </section>
      ) : null}

      <section className="react-panel">
        <h2 style={{ marginTop: 0 }}>Basic Information</h2>
        <form className="react-grid" onSubmit={saveBasicInfo}>
          <div className="react-grid react-grid-2">
            <label>
              <span className="react-label">Client ID (auto-generated)</span>
              <input className="react-input" value={form.clientId} readOnly />
            </label>

            <label>
              <span className="react-label">Full Name</span>
              <input
                className="react-input"
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                placeholder="At least 4 names"
                required
              />
            </label>

            <label>
              <span className="react-label">Phone Country Code</span>
              <select
                className="react-input"
                value={form.phoneCountryCode}
                onChange={(event) => updateField('phoneCountryCode', event.target.value)}
              >
                {phoneOptions.map((option) => (
                  <option key={option.display} value={option.dial}>{option.display}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="react-label">Phone Number</span>
              <input
                className="react-input"
                value={form.phoneNumber}
                onChange={(event) => updateField('phoneNumber', event.target.value)}
                inputMode="numeric"
                placeholder="Phone number"
                required
              />
            </label>

            <label>
              <span className="react-label">Email Address</span>
              <input
                className="react-input"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="client@example.com"
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
                minLength={6}
                placeholder="Minimum 6 characters"
                required
              />
            </label>

            <label>
              <span className="react-label">Gender</span>
              <select
                className="react-input"
                value={form.gender}
                onChange={(event) => updateField('gender', event.target.value)}
                required
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>

            <label>
              <span className="react-label">Birthday</span>
              <input
                className="react-input"
                type="date"
                value={form.birthday}
                onChange={(event) => updateField('birthday', event.target.value)}
                required
              />
            </label>

            <label>
              <span className="react-label">Country</span>
              <select
                className="react-input"
                value={form.country}
                onChange={(event) => updateField('country', event.target.value)}
                required
              >
                <option value="">Select country</option>
                {countries.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="react-label">Sport Club</span>
              <input
                className="react-input"
                value={form.club}
                onChange={(event) => updateField('club', event.target.value)}
                placeholder="Club name"
              />
            </label>

            <label>
              <span className="react-label">Religion</span>
              <select
                className="react-input"
                value={form.religion}
                onChange={(event) => updateField('religion', event.target.value)}
              >
                <option value="">Select religion</option>
                <option value="Islam">Islam</option>
                <option value="Christianity">Christianity</option>
                <option value="Judaism">Judaism</option>
                <option value="Hinduism">Hinduism</option>
                <option value="Buddhism">Buddhism</option>
                <option value="Other">Other</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button className="react-btn react-btn-ghost" type="button" onClick={() => navigate('/client-login')}>
              Cancel
            </button>
            <button className="react-btn react-btn-ghost" type="button" onClick={runAutofill}>
              Autofill
            </button>
            <button className="react-btn" type="submit" disabled={saving || !canSubmit}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default ProfileSetup;
