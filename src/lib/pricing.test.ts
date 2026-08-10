import { describe, expect, it } from 'vitest';
import { calculatePrice } from './pricing';

describe('calculatePrice', () => {
  it('calculates one-sided print without discount', () => {
    expect(calculatePrice(1, true, false)).toMatchObject({ baseUnit: 320, frontUnit: 145, backUnit: 0, subtotal: 465, discount: 0, total: 465 });
  });

  it('applies the configured quantity breaks', () => {
    expect(calculatePrice(5, true, true).discount).toBe(207);
    expect(calculatePrice(10, true, true).discount).toBe(708);
  });

  it('accepts a typed configuration without changing the formula', () => {
    expect(calculatePrice(2, true, false, { baseUnit: 100, frontPrintUnit: 20, backPrintUnit: 30, quantityDiscounts: [] })).toEqual({ baseUnit: 100, frontUnit: 20, backUnit: 0, subtotal: 240, discount: 0, total: 240 });
  });
});
