import { describe, expect, it } from 'vitest';
import { applyTemplateToActiveSide, sideHasDesignContent } from './templateApplication';

describe('applyTemplateToActiveSide', () => {
  it('replaces only the requested side', () => {
    const front = { version: '7.4.0', objects: [{ text: 'ön' }] };
    const back = { version: '7.4.0', objects: [{ text: 'arka' }] };
    const template = { version: '7.4.0', objects: [{ text: 'şablon' }] };
    const next = applyTemplateToActiveSide({ front, back }, 'front', template);
    expect(next.front).toBe(template);
    expect(next.back).toBe(back);
  });

  it('requires confirmation only when the active side has content', () => {
    expect(sideHasDesignContent({ version: '7.4.0', objects: [] })).toBe(false);
    expect(sideHasDesignContent({ version: '7.4.0', objects: [{ text: 'mevcut' }] })).toBe(true);
  });
});
