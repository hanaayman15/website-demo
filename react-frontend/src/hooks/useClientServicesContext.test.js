import { describe, expect, it } from 'vitest';
import {
  buildClientSummary,
  resolveClientServicesLinks,
} from './useClientServicesContext';

describe('useClientServicesContext helpers', () => {
  it('builds client service links with client_id suffix', () => {
    const links = resolveClientServicesLinks(42);
    expect(links.nutrition).toContain('client_id=42');
    expect(links.mental).toContain('/mental-coaching');
  });

  it('builds client summary with context and fallback id', () => {
    const summary = buildClientSummary({ full_name: 'User', email: 'u@x.com' }, '7');
    expect(summary.name).toBe('User');
    expect(summary.id).toBe('7');
  });
});
