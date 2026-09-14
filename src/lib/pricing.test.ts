import { describe, expect, it } from 'vitest';
import { calculatePrice, cartLineTotal } from './pricing';

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

  it('recalculates custom-design lines at every quantity threshold', () => {
    for (const quantity of [4, 5, 9, 10]) {
      for (const [front, back] of [[false, false], [true, false], [false, true], [true, true]]) {
        const price = calculatePrice(quantity, front, back);
        expect(cartLineTotal({ unitPrice: price.baseUnit + price.frontUnit + price.backUnit, quantity, printSides: { front, back } })).toBe(price.total);
      }
    }
  });

  it('matches Studio pricing for every supported quantity and preserves legacy lines', () => {
    for (let quantity = 1; quantity <= 25; quantity += 1) {
      for (const [front, back] of [[false, false], [true, false], [false, true], [true, true]]) {
        const price = calculatePrice(quantity, front, back);
        expect(cartLineTotal({ unitPrice: price.baseUnit + price.frontUnit + price.backUnit, quantity, printSides: { front, back } })).toBe(price.total);
      }
    }
    expect(cartLineTotal({ unitPrice: 250, quantity: 3 })).toBe(750);
  });
});
