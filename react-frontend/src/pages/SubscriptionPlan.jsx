import { useSubscriptionPlans, SUBSCRIPTION_PLAN_OPTIONS } from '../hooks/useSubscriptionPlans';
import '../assets/styles/react-pages.css';

function SubscriptionPlan() {
  const { state, selectedPlanMeta, selectPlan, continueFlow, skipFlow } = useSubscriptionPlans({ saveToBackend: true });

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1100, gap: '1rem' }}>
      <section className="react-panel react-grid" style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0 }}>Choose Your Subscription Plan</h1>
        <p className="react-muted" style={{ margin: 0 }}>Pick the level of coaching and support that fits your goals.</p>
      </section>

      {state.error ? <div className="react-alert react-alert-error">{state.error}</div> : null}
      {state.message ? <div className="react-alert react-alert-success">{state.message}</div> : null}

      <section className="react-grid react-grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {SUBSCRIPTION_PLAN_OPTIONS.map((plan) => {
          const selected = state.selectedPlan === plan.key;
          return (
            <article
              key={plan.key}
              className="react-panel react-grid"
              style={{
                gap: '0.65rem',
                borderColor: selected ? '#2563eb' : undefined,
                boxShadow: plan.popular ? '0 12px 24px rgba(37, 99, 235, 0.14)' : undefined,
              }}
            >
              {plan.popular ? <div className="react-label">POPULAR</div> : null}
              <h2 style={{ margin: 0 }}>{plan.name}</h2>
              <p className="react-muted" style={{ margin: 0 }}>{plan.subtitle}</p>
              <p style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700 }}>{plan.price}</p>
              <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                {plan.features.map((feature) => (
                  <li key={`${plan.key}-${feature}`}>{feature}</li>
                ))}
              </ul>
              <button className="react-btn" type="button" disabled={state.saving} onClick={() => selectPlan(plan.key)}>
                {selected ? 'Selected' : `Select ${plan.name}`}
              </button>
            </article>
          );
        })}
      </section>

      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <div className="react-label" style={{ marginBottom: 0 }}>Selected Plan</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedPlanMeta.name}</div>
        </div>
        <div className="react-inline-actions">
          <button className="react-btn" type="button" disabled={state.saving} onClick={continueFlow}>
            {state.saving ? 'Saving...' : 'Continue'}
          </button>
          <button className="react-btn react-btn-ghost" type="button" disabled={state.saving} onClick={skipFlow}>
            Skip for now
          </button>
        </div>
      </section>
    </main>
  );
}

export default SubscriptionPlan;
