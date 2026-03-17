import { describe, expect, it } from 'vitest';
import {
  buildTeamViewInitialState,
  buildTeamViewRow,
  teamViewReducer,
} from './useTeamView';

describe('useTeamView helpers', () => {
  it('builds table row from player data', () => {
    const row = buildTeamViewRow({ player_number: 1, full_name: 'Player', id: 77 }, 5, true);
    expect(row.number).toBe(1);
    expect(row.detailHref).toContain('team_id=5');
  });

  it('removes details link when role is restricted', () => {
    const row = buildTeamViewRow({ player_number: 1 }, 3, false);
    expect(row.detailHref).toBe('');
  });

  it('supports reducer load success state', () => {
    const initial = buildTeamViewInitialState();
    const next = teamViewReducer(initial, { type: 'LOAD_SUCCESS', payload: { team: { id: 1 }, rows: [] } });
    expect(next.loading).toBe(false);
    expect(next.team.id).toBe(1);
  });
});
