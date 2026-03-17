import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../assets/styles/react-pages.css';

function TestInput() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [output, setOutput] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const maskedPassword = password ? `***${password.slice(-3)}` : 'empty';
    setOutput(`Email: ${email || 'empty'}\nPassword: ${maskedPassword}`);
  };

  const resetFields = () => {
    setEmail('');
    setPassword('');
    setOutput('');
  };

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 760, gap: '1rem' }}>
      <section className="react-panel react-grid">
        <h1 style={{ marginTop: 0, marginBottom: 0 }}>Simple Input Test</h1>
        <p className="react-muted" style={{ marginTop: 0 }}>
          Use this page to verify keyboard input and form behavior independently from login page scripts.
        </p>

        <form className="react-grid" onSubmit={handleSubmit}>
          <label>
            <span className="react-label">Test Email Input</span>
            <input
              className="react-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Type here..."
            />
          </label>

          <label>
            <span className="react-label">Test Password Input</span>
            <input
              className="react-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Type here..."
            />
          </label>

          <div className="react-inline-actions">
            <button className="react-btn" type="submit">Submit Test</button>
            <button className="react-btn react-btn-ghost" type="button" onClick={resetFields}>Reset</button>
          </div>
        </form>

        <pre className="react-json-block">{output || 'No input submitted yet.'}</pre>

        <div className="react-grid" style={{ gap: '0.35rem' }}>
          <p className="react-muted" style={{ margin: 0 }}>Quick links:</p>
          <div className="react-inline-actions">
            <Link className="react-btn react-btn-ghost" to="/client-login">Go to Login Page</Link>
            <Link className="react-btn react-btn-ghost" to="/test-connection">Test Backend Connection</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default TestInput;
