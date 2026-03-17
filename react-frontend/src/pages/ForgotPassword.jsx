import { Link } from 'react-router-dom';
import { usePasswordRecovery } from '../hooks/usePasswordRecovery';
import '../assets/styles/react-pages.css';

function ForgotPassword() {
  const {
    state,
    updateField,
    submitEmail,
    submitCode,
    submitPassword,
    resendCode,
    backToEmail,
  } = usePasswordRecovery();

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 760, gap: '1rem' }}>
      <section className="react-panel react-grid">
        <h1 style={{ marginTop: 0, marginBottom: 0 }}>Reset Your Password</h1>
        <p className="react-muted" style={{ marginTop: 0 }}>We will guide you through secure account recovery.</p>

        {state.error ? <div className="react-alert react-alert-error">{state.error}</div> : null}
        {state.message ? <div className="react-alert react-alert-success">{state.message}</div> : null}

        {state.step === 'email' ? (
          <form className="react-grid" onSubmit={submitEmail}>
            <label>
              <span className="react-label">Email Address</span>
              <input
                className="react-input"
                type="email"
                value={state.email}
                onChange={(event) => updateField('email', event.target.value)}
                required
              />
            </label>
            <button className="react-btn" type="submit" disabled={state.loading}>
              {state.loading ? 'Sending...' : 'Send Reset Code'}
            </button>
            <p className="react-muted" style={{ margin: 0 }}>
              Remember your password? <Link to="/client-login">Back to login</Link>
            </p>
          </form>
        ) : null}

        {state.step === 'code' ? (
          <form className="react-grid" onSubmit={submitCode}>
            <p className="react-muted" style={{ margin: 0 }}>
              Enter the verification code sent to <strong>{state.email}</strong>.
            </p>
            <label>
              <span className="react-label">Verification Code</span>
              <input
                className="react-input"
                value={state.code}
                onChange={(event) => updateField('code', event.target.value)}
                maxLength={6}
                required
              />
            </label>
            <div className="react-inline-actions">
              <button className="react-btn" type="submit" disabled={state.loading}>
                {state.loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button className="react-btn react-btn-ghost" type="button" disabled={state.loading} onClick={backToEmail}>
                Use Different Email
              </button>
              <button className="react-btn react-btn-ghost" type="button" disabled={state.loading} onClick={resendCode}>
                Resend Code
              </button>
            </div>
          </form>
        ) : null}

        {state.step === 'password' ? (
          <form className="react-grid" onSubmit={submitPassword}>
            <label>
              <span className="react-label">New Password</span>
              <input
                className="react-input"
                type="password"
                value={state.newPassword}
                onChange={(event) => updateField('newPassword', event.target.value)}
                required
              />
            </label>
            <label>
              <span className="react-label">Confirm Password</span>
              <input
                className="react-input"
                type="password"
                value={state.confirmPassword}
                onChange={(event) => updateField('confirmPassword', event.target.value)}
                required
              />
            </label>
            <button className="react-btn" type="submit" disabled={state.loading}>
              {state.loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        ) : null}

        {state.step === 'success' ? (
          <div className="react-grid">
            <h2 style={{ margin: 0 }}>Password Reset Successful</h2>
            <p className="react-muted" style={{ margin: 0 }}>
              Your password has been updated. Continue to login with the new credentials.
            </p>
            <Link className="react-btn" to="/client-login">Go to Login</Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default ForgotPassword;
