import { describe, expect, it } from 'vitest';
import { createProductionSnapshot } from './productionSnapshot';

describe('createProductionSnapshot', () => {
  it('freezes a copy of the front and back design at order time', () => {
    const documents = { front: { version: '7.4.0', objects: [{ type: 'text', text: 'Ön' }] }, back: { version: '7.4.0', objects: [] } };
    const measurements = { front: [], back: [] };
    const snapshot = createProductionSnapshot(documents, measurements, {}, '2026-09-22T12:00:00.000Z');
    documents.front.objects.push({ type: 'text', text: 'Sonradan eklendi' });
    expect(snapshot.lockedAt).toBe('2026-09-22T12:00:00.000Z');
    expect(snapshot.documents.front.objects).toHaveLength(1);
  });
});
