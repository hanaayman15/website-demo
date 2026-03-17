import { describe, expect, it } from 'vitest';
import { mapAccounts, resolveStoredEmail } from './useAccountRecovery';

describe('useAccountRecovery helpers', () => {
  const clients = [
    { id: 1, name: 'First', email: '' },
    { id: 2, name: 'Second', email: 'second@example.com' },
  ];

  it('resolves direct local email when available', () => {
    const email = resolveStoredEmail(clients, 1, ' direct@example.com ');
    expect(email).toBe('direct@example.com');
  });

  it('falls back to first client with valid email', () => {
    const email = resolveStoredEmail(clients, null, '');
    expect(email).toBe('second@example.com');
  });

  it('maps account entries and marks current account', () => {
    const mapped = mapAccounts(clients, 2, '');
    expect(mapped).toHaveLength(2);
    expect(mapped[1].isCurrent).toBe(true);
    expect(mapped[1].email).toBe('second@example.com');
  });
});
