import { describe, expect, it } from 'vitest';
import {
  buildConsultationPayload,
  buildInitialSubscriptionState,
  resolveOnboardingRedirect,
  subscriptionPlansReducer,
} from './useSubscriptionPlans';

describe('useSubscriptionPlans helpers', () => {
  it('builds consultation payload shape', () => {
    const payload = buildConsultationPayload({ clientId: 7, plan: 'monthly' });
    expect(payload.client_id).toBe(7);
    expect(payload.consultation_type).toBe('monthly');
    expect(typeof payload.timestamp).toBe('string');
  });

  it('updates reducer on select and save actions', () => {
    const initial = buildInitialSubscriptionState();
    const selected = subscriptionPlansReducer(initial, { type: 'SELECT_PLAN', payload: 'annually' });
    expect(selected.selectedPlan).toBe('annually');

    const saving = subscriptionPlansReducer(selected, { type: 'SAVE_START' });
    expect(saving.saving).toBe(true);
  });

  it('resolves default onboarding redirect', () => {
    expect(resolveOnboardingRedirect()).toBe('/profile-setup');
  });
});
