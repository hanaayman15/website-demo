import { Link } from 'react-router-dom';
import { useAccountRecovery } from '../hooks/useAccountRecovery';
import '../assets/styles/react-pages.css';

function AccountRecovery() {
  const {
    storedEmail,
    message,
    accounts,
    revealStoredEmail,
    updateEmailForAccount,
    copyEmail,
  } = useAccountRecovery();

  const promptForAccountEmail = (account) => {
    const input = window.prompt(`Enter email for ${account.name}`, account.email || storedEmail || '');
    if (!input) return;
    updateEmailForAccount(account.id, input);
  };

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 900, gap: '1rem' }}>
      <section className="react-panel react-grid">
        <h1 style={{ marginTop: 0, marginBottom: 0 }}>Account Recovery</h1>
        <p className="react-muted" style={{ marginTop: 0 }}>
          Retrieve account email details from browser storage and manage local account entries.
        </p>

        {message ? <div className="react-alert react-alert-success">{message}</div> : null}

        <div className="react-inline-actions">
          <button className="react-btn" type="button" onClick={revealStoredEmail}>Show Stored Email</button>
          <button className="react-btn react-btn-ghost" type="button" onClick={copyEmail} disabled={!storedEmail}>Copy Email</button>
        </div>

        <div className="stat-item">
          <div className="stat-label">Registered Email</div>
          <div className="stat-value" style={{ fontSize: '1rem' }}>{storedEmail || 'No email found in local storage.'}</div>
        </div>

        <div className="react-grid" style={{ gap: '0.5rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: 0 }}>Stored Accounts</h2>
          {!accounts.length ? (
            <p className="react-muted" style={{ margin: 0 }}>No accounts found in browser storage.</p>
          ) : (
            accounts.map((account) => (
              <article key={`account-${account.id}`} className="stat-item react-grid" style={{ gap: '0.4rem' }}>
                <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
                  <strong>{account.name}</strong>
                  {account.isCurrent ? <span className="react-label">Current Client</span> : null}
                </div>
                <div className="react-muted">ID: {account.id || 'N/A'}</div>
                <div>Email: {account.email || 'No email stored'}</div>
                <div>
                  <button className="react-btn react-btn-ghost" type="button" onClick={() => promptForAccountEmail(account)}>
                    Add / Update Email
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="react-inline-actions">
          <Link className="react-btn react-btn-ghost" to="/client-login">Back to Login</Link>
          <Link className="react-btn" to="/client-signup">Create New Account</Link>
        </div>
      </section>
    </main>
  );
}

export default AccountRecovery;
