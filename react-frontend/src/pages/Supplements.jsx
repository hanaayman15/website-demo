import { useNavigate } from 'react-router-dom';
import { useSupplements } from '../hooks/useSupplements';
import PageLayout from '../components/layout/PageLayout';
import SectionCard from '../components/ui/SectionCard';
import LockedOverlay from '../components/ui/LockedOverlay';
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
    <PageLayout
      title="Recommended Supplements"
      subtitle="Track your prescribed supplement protocol and logging status."
      actions={<button className="react-btn" type="button" onClick={goToUpgrade}>Upgrade Full Program</button>}
    >

      {error ? <div className="react-alert react-alert-error">{error}</div> : null}
      {message ? <div className="react-alert react-alert-success">{message}</div> : null}

      {customSupplements.length ? (
        <SectionCard as="section">
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
        </SectionCard>
      ) : null}

      <LockedOverlay
        title="Premium Supplement Program"
        description="Full supplement protocol access is locked until upgrade."
        ctaLabel="Unlock Premium"
        onCta={goToUpgrade}
        borderColor="#86efac"
      >
        <div className="react-grid">
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
      </LockedOverlay>

      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>Currently Taking: {takingCount} supplements</h2>
      </section>
    </PageLayout>
  );
}

export default Supplements;
