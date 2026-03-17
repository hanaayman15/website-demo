import { describe, expect, it } from 'vitest';
import { sourceLabel, splitClientsBySource } from './useClientList';

describe('useClientList helpers', () => {
  it('maps source labels correctly', () => {
    expect(sourceLabel('profile_setup')).toBe('Profile Setup');
    expect(sourceLabel('add_client')).toBe('Add Client');
    expect(sourceLabel('')).toBe('Add Client');
  });

  it('splits clients by created source', () => {
    const clients = [
      { id: 1, created_source: 'add_client' },
      { id: 2, created_source: 'profile_setup' },
      { id: 3, created_source: 'add_client' },
    ];

    const result = splitClientsBySource(clients);
    expect(result.addClientData).toHaveLength(2);
    expect(result.profileSetupData).toHaveLength(1);
    expect(result.profileSetupData[0].id).toBe(2);
  });
});
