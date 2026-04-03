import { useState } from 'react';
import { useSubscriptionPlans } from '../hooks/useSubscriptionPlans';
import SiteNav from '../components/layout/SiteNav';

const ACCENT = '#6eabf2';

function Plans() {
  const { state, selectPlan, continueFlow } = useSubscriptionPlans({ saveToBackend: false });

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
      features: ['Full customized diet', 'Full mental coaching', 'Weekly progress review', 'Direct coach messaging', 'Priority support'],
      cta: 'Get Elite Access',
    },
  ];

  const faqs = [
    { q: 'Can I upgrade or downgrade my plan?', a: 'Yes, you can change your plan anytime. Changes take effect at the start of your next billing cycle.' },
    { q: 'Is there a free trial?', a: 'The Basic plan is completely free forever. Try it out with no commitment!' },
    { q: 'What happens if I cancel my subscription?', a: 'You can cancel anytime and keep access until the end of your current billing period.' },
  ];

  const onSelect = async (planKey) => {
    selectPlan(planKey);
    localStorage.setItem('selectedPlan', planKey);
    await continueFlow();
  };

  return (
    <div className="bg-gray-50 text-gray-800 font-sans leading-normal">
      <SiteNav activePath="/plans" />

      <div className="py-16 bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">Invest in your performance today.</p>
        </div>
      </div>

      <section className="py-16">
        <div className="container mx-auto px-6">
          {state.error && <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800">{state.error}</div>}
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            {plans.map((plan) => (
              <div
                key={plan.key}
                className="bg-white p-8 rounded-3xl shadow-sm border flex flex-col transition-all duration-300 relative"
                style={{
                  borderColor: plan.featured ? ACCENT : '#e5e7eb',
                  boxShadow: plan.featured ? `0 20px 40px rgba(110, 171, 242, 0.15)` : undefined,
                  transform: plan.featured ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full" style={{ backgroundColor: ACCENT }}>
                    <span className="text-white text-xs font-bold uppercase">Most Popular</span>
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                <p className="mb-2" style={{ color: ACCENT, fontWeight: 500 }}>{plan.subtitle}</p>
                <p className="text-3xl font-bold mb-6">
                  {plan.price}
                  {!plan.price.startsWith('Free') && <span className="text-lg text-gray-500">/month</span>}
                </p>
                <ul className="space-y-4 text-gray-600 mb-8 flex-grow">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2">
                      <span className="text-green-500 font-bold">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => onSelect(plan.key)}
                  disabled={state.loading}
                  className="w-full py-3 rounded-xl font-bold transition"
                  style={{
                    backgroundColor: plan.featured ? ACCENT : 'transparent',
                    color: plan.featured ? 'white' : ACCENT,
                    border: `2px solid ${plan.featured ? ACCENT : '#e5e7eb'}`,
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-6 max-w-2xl">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details key={idx} className="bg-white p-6 rounded-lg border border-gray-200 open:shadow-md cursor-pointer">
                <summary className="font-bold flex items-center justify-between">
                  {faq.q}
                  <span className="ml-4">+</span>
                </summary>
                <p className="mt-4 text-gray-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-gray-500 text-sm border-t border-gray-200 bg-white">
        &copy; 2026 VitalityPath Nutrition Management. All rights reserved.
      </footer>
    </div>
  );
}

export default Plans;
