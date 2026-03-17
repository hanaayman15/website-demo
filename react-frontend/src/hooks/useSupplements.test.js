import { describe, expect, it } from 'vitest';
import { buildSupplementLogPayload } from './useSupplements';

describe('useSupplements helpers', () => {
  it('builds supplement log payload with expected backend shape', () => {
    const payload = buildSupplementLogPayload({
      clientId: 9,
      supplementName: ' Creatine Monohydrate ',
    });

    expect(payload.client_id).toBe(9);
    expect(payload.supplement_name).toBe('Creatine Monohydrate');
    expect(payload.notes).toContain('supplements page');
  });
});
