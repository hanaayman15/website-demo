import { describe, expect, it } from 'vitest';
import {
  addTeamReducer,
  buildAddTeamInitialState,
  buildTeamPayload,
  createTeamPlayer,
  recalcTeamPlayer,
} from './useAddTeam';

describe('useAddTeam helpers', () => {
  it('creates baseline team player model', () => {
    const player = createTeamPlayer(1);
    expect(player.player_number).toBe(1);
    expect(player.full_name).toBe('');
  });

  it('recalculates player metrics', () => {
    const player = recalcTeamPlayer({
      ...createTeamPlayer(1),
      gender: 'male',
      birthday: '2000-01-01',
      height: '180',
      weight: '80',
      body_fat_percentage: '15',
      skeletal_muscle: '36',
      activity_level: 'moderate',
      progression_type: 'maintain',
    });

    expect(Number(player.bmi)).toBeGreaterThan(20);
    expect(Number(player.tdee)).toBeGreaterThan(0);
  });

  it('builds team payload with numeric conversions', () => {
    const state = {
      ...buildAddTeamInitialState(),
      teamName: 'A Team',
      sportType: 'Football',
      coachName: 'Coach',
      startDate: '2026-03-17',
      packageSize: 1,
      players: [{ ...createTeamPlayer(1), full_name: 'One Two Three Four', email: 'a@b.com', gender: 'male', height: '180', weight: '80' }],
    };

    const payload = buildTeamPayload(state);
    expect(payload.team_name).toBe('A Team');
    expect(payload.players.length).toBe(1);
    expect(payload.players[0].height).toBe(180);
  });

  it('supports package-size reducer action', () => {
    const initial = buildAddTeamInitialState();
    const next = addTeamReducer(initial, { type: 'SET_PACKAGE_SIZE', payload: 20 });
    expect(next.players.length).toBe(20);
  });
});
