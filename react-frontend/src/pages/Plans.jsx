import { useState } from 'react';
import { useSubscriptionPlans } from '../hooks/useSubscriptionPlans';
import '../assets/styles/react-pages.css';

function Plans() {
  const { state, selectPlan, continueFlow } = useSubscriptionPlans({ saveToBackend: false });
  const [expandedFaq, setExpandedFaq] = useState('upgrade');

  const plans = [
    {
      key: 'basic',
      name: 'Basic',
      subtitle: 'For beginners',
      price: 'Free',
      features: ['Access to recipes', 'General nutrition articles', 'Weekly tips'],
      cta: 'Select Plan',
    },
    {
      key: 'pro',
      name: 'Pro Athlete',
      subtitle: 'For serious athletes',
      price: '$9.99/month',
      features: ['Personalized nutrition plan', 'Supplement guide', 'Monthly mental program', 'Weekly tips & recipes'],
      cta: 'Select Plan',
      featured: true,
    },
    {
      key: 'elite',
      name: 'Elite Performance',
      subtitle: 'Maximum results',
      price: '$24.99/month',
      features: ['Full customized diet', 'Full mental coaching', 'Weekly progress review', 'Direct coach messaging'],
      cta: 'Get Elite Access',
    },
  ];

  const faqs = [
    {
      key: 'upgrade',
      question: 'Can I upgrade or downgrade my plan?',
      answer: 'Yes, you can change your plan anytime. Changes take effect at the start of your next billing cycle.',
    },
    {
      key: 'trial',
      question: 'Is there a free trial?',
      answer: 'The Basic plan is completely free forever. Try it out with no commitment.',
    },
    {
      key: 'cancel',
      question: 'What happens if I cancel my subscription?',
      answer: 'You can cancel anytime and keep access until the end of your current billing period.',
    },
  ];

  const onSelect = async (planKey) => {
    selectPlan(planKey);
    localStorage.setItem('selectedPlan', planKey);
    await continueFlow();
  };

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1100, gap: '1rem' }}>
      <section className="react-panel react-grid" style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0 }}>Choose Your Plan</h1>
        <p className="react-muted" style={{ margin: 0 }}>Invest in your performance today.</p>
      </section>

      {state.error ? <div className="react-alert react-alert-error">{state.error}</div> : null}

      <section className="react-grid react-grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {plans.map((plan) => {
          const selected = state.selectedPlan === plan.key;
          return (
            <article
              key={plan.key}
              className="react-panel react-grid"
              style={{
                gap: '0.65rem',
                borderColor: selected ? '#2563eb' : undefined,
                boxShadow: plan.featured ? '0 12px 24px rgba(37, 99, 235, 0.12)' : undefined,
              }}
            >
              <h2 style={{ margin: 0 }}>{plan.name}</h2>
              <p className="react-muted" style={{ margin: 0 }}>{plan.subtitle}</p>
              <p style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700 }}>{plan.price}</p>
              <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                {plan.features.map((feature) => (
                  <li key={`${plan.key}-${feature}`}>{feature}</li>
                ))}
              </ul>
              <button className="react-btn" type="button" disabled={state.loading} onClick={() => onSelect(plan.key)}>
                {plan.cta}
              </button>
            </article>
          );
        })}
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Frequently Asked Questions</h2>
        {faqs.map((faq) => (
          <article key={faq.key} className="stat-item react-grid" style={{ gap: '0.35rem' }}>
            <button
              className="react-btn react-btn-ghost"
              type="button"
              onClick={() => setExpandedFaq(expandedFaq === faq.key ? '' : faq.key)}
              style={{ textAlign: 'left' }}
            >
              {faq.question}
            </button>
            {expandedFaq === faq.key ? <p className="react-muted" style={{ margin: 0 }}>{faq.answer}</p> : null}
          </article>
        ))}
      </section>
    </main>
  );
}

export default Plans;
