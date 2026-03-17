import { useNavigate } from 'react-router-dom';
import { useSupplements } from '../hooks/useSupplements';
import '../assets/styles/react-pages.css';

function Supplements() {
  const navigate = useNavigate();
  const {
    loading,
    savingName,
    error,
    message,
    baseSupplements,
    checkedMap,
    takingCount,
    customSupplements,
    toggleSupplement,
  } = useSupplements();

  const goToUpgrade = () => {
    navigate('/subscription-plan?upgrade=supplement-program');
  };

  if (loading) {
    return <main className="react-page-wrap">Loading supplements...</main>;
  }

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1100, gap: '1rem' }}>
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: '0.35rem' }}>Recommended Supplements</h1>
          <p className="react-muted" style={{ margin: 0 }}>Track your prescribed supplement protocol and logging status.</p>
        </div>
        <button className="react-btn" type="button" onClick={goToUpgrade}>Upgrade Full Program</button>
      </section>

      {error ? <div className="react-alert react-alert-error">{error}</div> : null}
      {message ? <div className="react-alert react-alert-success">{message}</div> : null}

      {customSupplements.length ? (
        <section className="react-panel react-grid">
          <h2 style={{ marginTop: 0, marginBottom: 0 }}>Your Prescribed Supplements</h2>
          <div className="react-grid react-grid-2">
            {customSupplements.map((supplement, index) => (
              <article key={`custom-${index}`} className="stat-item react-grid" style={{ gap: '0.35rem' }}>
                <h3 style={{ margin: 0 }}>{supplement.name || 'Custom Supplement'}</h3>
                <p className="react-muted" style={{ margin: 0 }}>Dosage: {supplement.amount || 'N/A'}g</p>
                {supplement.notes ? <p style={{ margin: 0 }}>{supplement.notes}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="react-panel react-grid" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', zIndex: 2 }}>
          <div className="react-panel react-grid" style={{ maxWidth: 430, borderColor: '#86efac' }}>
            <h2 style={{ margin: 0 }}>Premium Supplement Program</h2>
            <p className="react-muted" style={{ margin: 0 }}>
              Full supplement protocol access is locked until upgrade.
            </p>
            <button className="react-btn" type="button" onClick={goToUpgrade}>Unlock Premium</button>
          </div>
        </div>

        <div style={{ filter: 'blur(4px)', pointerEvents: 'none' }}>
          <div className="react-grid react-grid-2">
            {baseSupplements.map((supplement) => (
              <article key={supplement.key} className="stat-item react-grid" style={{ gap: '0.4rem' }}>
                <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0 }}>{supplement.name}</h3>
                  <span className="react-label">{supplement.tag}</span>
                </div>
                <p className="react-muted" style={{ margin: 0 }}>Dosage: {supplement.dosage}</p>
                <label className="react-inline-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(checkedMap[supplement.name])}
                    onChange={(event) => toggleSupplement(supplement.name, event.target.checked)}
                    disabled={savingName === supplement.name}
                  />
                  <span>{savingName === supplement.name ? 'Saving...' : 'Taking'}</span>
                </label>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>Currently Taking: {takingCount} supplements</h2>
      </section>
    </main>
  );
}

export default Supplements;
