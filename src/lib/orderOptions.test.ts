import { describe, expect, it } from 'vitest';
import { AVAILABLE_SHIRT_SIZES, clampOrderQuantity, MAX_ORDER_QUANTITY, normalizeOrderOptions } from './orderOptions';

describe('order options', () => {
  it('uses the cart maximum as the single quantity invariant', () => {
    expect(MAX_ORDER_QUANTITY).toBe(25);
    expect(clampOrderQuantity(50)).toBe(25);
    expect(clampOrderQuantity(0)).toBe(1);
    expect(clampOrderQuantity(Number.NaN)).toBe(1);
  });

  it('does not expose XXL and safely normalizes legacy drafts', () => {
    expect(AVAILABLE_SHIRT_SIZES).toEqual(['S', 'M', 'L', 'XL']);
    expect(normalizeOrderOptions({ color: 'white', size: 'XXL', fit: 'slim', quantity: 50 })).toMatchObject({ size: 'M', quantity: 25 });
  });
});
