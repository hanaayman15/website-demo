import { useState } from 'react';
import '../assets/styles/react-pages.css';

function TestApi() {
  const [result, setResult] = useState('');
  const [running, setRunning] = useState(false);

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';
  const endpoint = `${apiBase}/api/auth/clients-public?skip=0&limit=5`;

  const runTest = async () => {
    setRunning(true);
    const lines = ['Testing API connection...', '', `1) Fetching from: ${endpoint}`];
    try {
      const response = await fetch(endpoint);
      lines.push(`2) Response status: ${response.status}`);
      lines.push(`3) Response OK: ${response.ok}`);
      const data = await response.json();
      lines.push(`4) Data type: ${typeof data}`);
      lines.push(`5) Is array: ${Array.isArray(data)}`);
      lines.push(`6) Length: ${Array.isArray(data) ? data.length : 0}`);
      lines.push('');
      lines.push(`7) Data:\n${JSON.stringify(data, null, 2)}`);
      setResult(lines.join('\n'));
    } catch (error) {
      lines.push('');
      lines.push(`ERROR: ${error.message}`);
      setResult(lines.join('\n'));
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1000 }}>
      <section className="react-panel react-grid">
        <h1 style={{ marginTop: 0, marginBottom: 0 }}>API Connection Test</h1>
        <p className="react-muted" style={{ marginTop: 0 }}>
          Run a quick request against the clients-public endpoint and inspect the response shape.
        </p>
        <div className="react-inline-actions">
          <button className="react-btn" type="button" onClick={runTest} disabled={running}>
            {running ? 'Testing...' : 'Test API'}
          </button>
        </div>
        <pre className="react-json-block" style={{ maxHeight: 520 }}>{result || 'No test executed yet.'}</pre>
      </section>
    </main>
  );
}

export default TestApi;
