import { describe, expect, it } from 'vitest';
import { canContinue, hasOverflow } from './qualityGate';
import { measureDocument } from './measureDocument';
import type { DesignDocument } from '../types';
import type { MetaObject } from './measurements';
import { util } from 'fabric';

function objectFixture(left = 0, top = 0, width = 120, height = 120) {
  const object = {
    left, top, scaleX: 1, scaleY: 1, itemId: 'headless', itemKind: 'symbol', itemLabel: 'Headless', itemDetail: 'SVG', isVector: true,
    setCoords: () => undefined,
    getBoundingRect: () => ({ left: object.left, top: object.top, width: width * (object.scaleX ?? 1), height: height * (object.scaleY ?? 1) }),
    getScaledWidth: () => width * (object.scaleX ?? 1), getScaledHeight: () => height * (object.scaleY ?? 1),
    getCenterPoint: () => ({ x: object.left + object.getScaledWidth() / 2, y: object.top + object.getScaledHeight() / 2 }),
  };
  return object as unknown as MetaObject;
}

const document: DesignDocument = { version: '7.4.0', objects: [{}] };
const enliven = (objects: MetaObject[]) => (async () => objects) as typeof util.enlivenObjects;

describe('measureDocument', () => {
  it('enlivens and measures both faces without a Canvas', async () => {
    const front = await measureDocument(document, 'front', { enliven: enliven([objectFixture()]) });
    const back = await measureDocument(document, 'back', { enliven: enliven([objectFixture()]) });
    expect(front).toHaveLength(1);
    expect(back).toHaveLength(1);
    expect(front[0].side).toBe('front');
    expect(back[0].side).toBe('back');
  });

  it('uses the same clamp normalization as the mounted editor', async () => {
    const overflowing = objectFixture(330, 460);
    const unclamped = { id: 'overflow', side: 'back' as const, kind: 'symbol' as const, label: 'Overflow', xCm: 32, yCm: 43, widthCm: 10, heightCm: 10, angle: 0, detail: 'SVG', vector: true };
    expect(hasOverflow([unclamped])).toBe(true);
    const measurements = await measureDocument(document, 'back', { enliven: enliven([overflowing]) });
    expect(hasOverflow(measurements)).toBe(false);
    expect(canContinue(measurements)).toBe(true);
  });

  it('returns an empty list for empty, invalid, and failing input', async () => {
    expect(await measureDocument({ version: '7.4.0', objects: [] }, 'front')).toEqual([]);
    expect(await measureDocument({ version: '7.4.0' } as DesignDocument, 'front')).toEqual([]);
    expect(await measureDocument(document, 'front', { enliven: async () => { throw new Error('bad object'); } })).toEqual([]);
  });
});
