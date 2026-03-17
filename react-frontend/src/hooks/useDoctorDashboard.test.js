import { describe, expect, it } from 'vitest';
import { normalizeDoctorDashboardConfig, summarizeTeams } from './useDoctorDashboard';

describe('useDoctorDashboard helpers', () => {
  it('normalizes legacy clients labels to teams', () => {
    const normalized = normalizeDoctorDashboardConfig({
      navigation: [{ label: 'Clients', href: 'clients.html' }],
      modules: [{ label: 'Clients', href: 'clients.html', description: 'Legacy' }],
    });

    expect(normalized.navigation[0].label).toBe('Teams');
    expect(normalized.modules[0].label).toBe('Teams');
    expect(normalized.navigation[0].href).toBe('/clients');
  });

  it('summarizes total teams and players', () => {
    const summary = summarizeTeams([
      { players_count: 11 },
      { players_count: 17 },
      { players_count: 0 },
    ]);

    expect(summary).toEqual({ totalTeams: 3, totalPlayers: 28 });
  });
});
