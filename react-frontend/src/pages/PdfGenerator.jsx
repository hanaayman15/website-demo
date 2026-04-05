import { usePdfGenerator } from '../hooks/usePdfGenerator';
import AdminQuickNav from '../components/layout/AdminQuickNav';
import '../assets/styles/react-pages.css';

function PdfGenerator() {
  const {
    state,
    selectionSummary,
    canGenerate,
    setLanguage,
    setTeam,
    setClient,
    generatePdf,
    generateServerPdf,
  } = usePdfGenerator();
  const canUsePdfGenerator = state.role === 'admin' || state.role === 'doctor';

  const getSafeErrorText = (err) => {
    if (typeof err?.message === 'string' && err.message.trim()) return err.message;
    if (typeof err === 'string' && err.trim()) return err;
    if (err && typeof err === 'object') {
      const maybeDetail = err.detail || err.error || err.msg;
      if (typeof maybeDetail === 'string' && maybeDetail.trim()) return maybeDetail;
    }
    return 'Unknown error. Check console/network for details.';
  };

  const onGenerate = async () => {
    try {
      if (state.clientId) {
        const language = state.language === 'arabic' ? 'arabic' : 'english';
        const targetUrl = `/client-detail?id=${encodeURIComponent(state.clientId)}&auto_generate_pdf=1&pdf_language=${encodeURIComponent(language)}`;
        const popup = window.open(targetUrl, '_blank', 'noopener');
        if (!popup) {
          window.location.assign(targetUrl);
        }
        return;
      }

      await generatePdf();
    } catch (err) {
      alert(`PDF generation failed: ${getSafeErrorText(err)}`);
    }
  };

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1240, gap: '1rem' }}>
      <AdminQuickNav activePath="/pdf-generator" title="PDF Generator" />
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: '0.35rem' }}>PDF Generator</h1>
          <p className="react-muted" style={{ margin: 0 }}>Generate client report PDFs with language selection.</p>
        </div>
      </section>

      {!canUsePdfGenerator ? (
        <section className="react-alert react-alert-error">Only admin or doctor users can access PDF generation on this page.</section>
      ) : null}

      {state.error ? <div className="react-alert react-alert-error">{state.error}</div> : null}
      {state.message ? <div className="react-alert react-alert-success">{state.message}</div> : null}

      <section className="react-panel react-grid react-grid-2">
        <label>
          <span className="react-label">Language</span>
          <select className="react-input" value={state.language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="english">English</option>
            <option value="arabic">Arabic</option>
          </select>
        </label>

        <label>
          <span className="react-label">Team Selection</span>
          <select className="react-input" value={state.teamId} onChange={(e) => setTeam(e.target.value)} disabled={!canUsePdfGenerator || state.loading}>
            <option value="">Select a team...</option>
            {state.teams.map((team) => (
              <option key={team.id} value={team.id}>{team.team_name || '-'} ({team.players_count || 0} players)</option>
            ))}
          </select>
        </label>

        <label style={{ gridColumn: '1 / -1' }}>
          <span className="react-label">Client Selection</span>
          <select className="react-input" value={state.clientId} onChange={(e) => setClient(e.target.value)} disabled={!canUsePdfGenerator || state.loading}>
            <option value="">Select a client...</option>
            {state.clients.map((client) => (
              <option key={client.id} value={client.id}>{client.full_name || '-'} (ID: {client.display_id || client.id})</option>
            ))}
          </select>
        </label>
      </section>

      <section className="react-panel react-grid">
        <div className="react-muted">{selectionSummary}</div>
        <div className="react-inline-actions">
          <button className="react-btn" type="button" disabled={!canGenerate} onClick={onGenerate}>
            {state.generating ? 'Generating...' : 'Generate PDF'}
          </button>
          <button
            className="react-btn react-btn-ghost"
            type="button"
            disabled={!canGenerate || !state.clientId}
            onClick={generateServerPdf}
          >
            Generate Direct Download
          </button>
        </div>
      </section>
    </main>
  );
}

export default PdfGenerator;
