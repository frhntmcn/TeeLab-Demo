import { describe, expect, it } from 'vitest';
import { AVAILABLE_SHIRT_SIZES, clampOrderQuantity, MAX_ORDER_QUANTITY, normalizeOrderOptions, setSizeQuantity, sizeEntries } from './orderOptions';

describe('order options', () => {
  it('uses the cart maximum as the single quantity invariant', () => {
    expect(MAX_ORDER_QUANTITY).toBe(999);
    expect(clampOrderQuantity(1_500)).toBe(999);
    expect(clampOrderQuantity(0)).toBe(1);
    expect(clampOrderQuantity(Number.NaN)).toBe(1);
  });

  it('exposes XXL and safely normalizes legacy drafts', () => {
    expect(AVAILABLE_SHIRT_SIZES).toEqual(['S', 'M', 'L', 'XL', 'XXL']);
    expect(normalizeOrderOptions({ color: 'white', size: 'XXL', fit: 'slim', quantity: 50 })).toMatchObject({ size: 'XXL', quantity: 50 });
  });

  it('migrates a one-size draft and maintains a bounded multi-size total', () => {
    const legacy = normalizeOrderOptions({ color: 'white', size: 'M', fit: 'slim', quantity: 4 });
    expect(sizeEntries(legacy)).toEqual([{ size: 'M', quantity: 4 }]);
    const mixed = setSizeQuantity(legacy, 'XL', 3);
    expect(mixed.quantity).toBe(7);
    expect(sizeEntries(mixed)).toEqual([{ size: 'M', quantity: 4 }, { size: 'XL', quantity: 3 }]);
    expect(setSizeQuantity(mixed, 'XL', 0).quantity).toBe(4);
    expect(setSizeQuantity(mixed, 'XL', 5000).quantity).toBe(999);
    expect(normalizeOrderOptions({ ...mixed, sizeQuantities: { S: 999, M: 999 } }).quantity).toBe(999);
  });
});
