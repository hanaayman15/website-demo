import { useState } from 'react';
import '../assets/styles/react-pages.css';

function TestConnection() {
  const [result, setResult] = useState('No connection test has been executed yet.');
  const [running, setRunning] = useState(false);
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';

  const runCheck = async (path, options = {}) => {
    setRunning(true);
    try {
      const response = await fetch(`${apiBase}${path}`, options);
      const data = await response.json().catch(() => null);
      const lines = [
        `Endpoint: ${path}`,
        `Status: ${response.status}`,
        `OK: ${response.ok}`,
        '',
        `Body:\n${JSON.stringify(data, null, 2)}`,
      ];
      setResult(lines.join('\n'));
    } catch (error) {
      setResult(`Endpoint: ${path}\n\nConnection failed: ${error.message}`);
    } finally {
      setRunning(false);
    }
  };

  const testLoginEndpoint = async () => {
    await runCheck('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@client.com', password: 'demo123' }),
    });
  };

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1000, gap: '1rem' }}>
      <section className="react-panel react-grid">
        <h1 style={{ marginTop: 0, marginBottom: 0 }}>Backend Connection Test</h1>
        <p className="react-muted" style={{ marginTop: 0 }}>API URL: {apiBase}</p>

        <div className="react-inline-actions">
          <button className="react-btn" type="button" onClick={() => runCheck('/health')} disabled={running}>Test /health</button>
          <button className="react-btn react-btn-ghost" type="button" onClick={() => runCheck('/')} disabled={running}>Test / (root)</button>
          <button className="react-btn react-btn-ghost" type="button" onClick={testLoginEndpoint} disabled={running}>Test Login Endpoint</button>
        </div>

        <pre className="react-json-block" style={{ maxHeight: 520 }}>{running ? 'Running test...' : result}</pre>
      </section>
    </main>
  );
}

export default TestConnection;
