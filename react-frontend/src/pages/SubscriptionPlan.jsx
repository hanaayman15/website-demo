import { useSubscriptionPlans, SUBSCRIPTION_PLAN_OPTIONS } from '../hooks/useSubscriptionPlans';
import '../assets/styles/react-pages.css';

const ACCENT = '#6eabf2';

const PLAN_BADGE = {
  starter: 'Once',
  pro: 'Monthly',
  elite: 'Annually',
};

function SubscriptionPlan() {
  const { state, selectedPlanMeta, selectPlan, continueFlow, skipFlow } = useSubscriptionPlans({ saveToBackend: true });

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Consultation Plan</h1>
          <p className="text-xl text-gray-600">Pick how often you want consultation support</p>
        </section>

        {state.error ? <div className="react-alert react-alert-error mb-6">{state.error}</div> : null}
        {state.message ? <div className="react-alert react-alert-success mb-6">{state.message}</div> : null}

        <section className="grid md:grid-cols-3 gap-8 mb-12">
          {SUBSCRIPTION_PLAN_OPTIONS.map((plan) => {
            const selected = state.selectedPlan === plan.key;
            return (
              <article
                key={plan.key}
                className="relative bg-white rounded-2xl shadow-lg border-2 p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                style={{
                  borderColor: selected ? ACCENT : '#e5e7eb',
                  background: selected
                    ? 'linear-gradient(135deg, rgba(110,171,242,0.12) 0%, rgba(110,171,242,0.04) 100%)'
                    : '#ffffff',
                }}
              >
                {plan.popular ? (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="text-white px-4 py-1 rounded-full text-sm font-bold" style={{ backgroundColor: ACCENT }}>
                      POPULAR
                    </span>
                  </div>
                ) : null}

                <div className={`text-center mb-6 ${plan.popular ? 'pt-4' : ''}`}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{PLAN_BADGE[plan.key] || plan.name}</h2>
                  <div className="text-gray-600 mb-4">{plan.subtitle}</div>
                  <div className="text-4xl font-bold" style={{ color: ACCENT }}>{plan.price}</div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={`${plan.key}-${feature}`} className="flex items-center text-gray-700">
                      <span
                        className="inline-flex items-center justify-center text-white mr-2 text-xs font-bold"
                        style={{ width: 20, height: 20, borderRadius: '999px', backgroundColor: '#10b981' }}
                      >
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className="w-full text-white py-3 rounded-lg font-semibold transition hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                  type="button"
                  disabled={state.saving}
                  onClick={() => selectPlan(plan.key)}
                >
                  {selected ? `${plan.name} Selected` : `Select ${PLAN_BADGE[plan.key] || plan.name}`}
                </button>
              </article>
            );
          })}
        </section>

        <section
          className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8"
          style={{ display: selectedPlanMeta ? 'block' : 'none' }}
        >
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div>
              <p className="text-gray-600">Selected Plan:</p>
              <p className="text-2xl font-bold" style={{ color: ACCENT }}>{selectedPlanMeta.name}</p>
            </div>
            <button
              type="button"
              disabled={state.saving}
              onClick={continueFlow}
              className="text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              style={{ backgroundColor: ACCENT }}
            >
              {state.saving ? 'Saving...' : 'Continue →'}
            </button>
          </div>
        </section>

        <section className="text-center">
          <button
            className="text-gray-600 hover:text-gray-900 font-semibold"
            type="button"
            disabled={state.saving}
            onClick={skipFlow}
          >
            Skip for now and explore
          </button>
        </section>
      </div>
    </main>
  );
}

export default SubscriptionPlan;
