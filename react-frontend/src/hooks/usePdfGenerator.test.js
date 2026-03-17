import { describe, expect, it } from 'vitest';
import {
  buildPdfGeneratorInitialState,
  buildPdfRequestPayload,
  normalizePdfClient,
  pdfGeneratorReducer,
} from './usePdfGenerator';

describe('usePdfGenerator helpers', () => {
  it('normalizes client payload entries', () => {
    const client = normalizePdfClient({ id: '12', displayId: 90, name: 'Client', age: '22' });
    expect(client.id).toBe(12);
    expect(client.displayId).toBe('90');
  });

  it('builds request payload', () => {
    const payload = buildPdfRequestPayload({ language: 'arabic', clients: [{ id: 1, name: 'A' }] });
    expect(payload.language).toBe('arabic');
    expect(payload.clients.length).toBe(1);
  });

  it('supports reducer selection transitions', () => {
    const initial = buildPdfGeneratorInitialState();
    const withTeam = pdfGeneratorReducer(initial, { type: 'SET_TEAM', payload: '1' });
    expect(withTeam.teamId).toBe('1');
  });
});
