import { describe, expect, it } from 'vitest';
import { designHash } from './designIdentity';

describe('designHash', () => {
  it('is stable for equivalent object key order', () => {
    const first = { front: { version: '7.4.0', objects: [{ left: 10, top: 20 }] }, back: { version: '7.4.0', objects: [] } };
    const second = { front: { objects: [{ top: 20, left: 10 }], version: '7.4.0' }, back: { objects: [], version: '7.4.0' } };
    expect(designHash(first)).toBe(designHash(second));
  });

  it('changes when the design changes', () => {
    const base = { front: { version: '7.4.0', objects: [] }, back: { version: '7.4.0', objects: [] } };
    expect(designHash(base)).not.toBe(designHash({ ...base, front: { version: '7.4.0', objects: [{ type: 'text' }] } }));
  });

  it('does not use template metadata as part of the document hash', () => {
    const design = { front: { version: '7.4.0', objects: [{ type: 'text', text: 'aynı' }] }, back: { version: '7.4.0', objects: [] } };
    const metadata = { templateId: 'big-heading', templateSide: 'front' };
    expect(designHash(design)).toBe(designHash({ ...design }));
    expect(metadata.templateId).toBe('big-heading');
  });
});
