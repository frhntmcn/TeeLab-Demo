import { describe, expect, it } from 'vitest';
import { products } from '../data/products';
import { filterProducts } from './catalog';

describe('filterProducts', () => {
  it('returns every product for the default filter without mutating source data', () => {
    const sourceIds = products.map((product) => product.id);
    const result = filterProducts(products, 'all');

    expect(result).toHaveLength(4);
    expect(result).not.toBe(products);
    expect(products.map((product) => product.id)).toEqual(sourceIds);
  });

  it.each([
    ['cosmic', 'gece-yörüngesi'],
    ['anatolia', 'anadolu-form'],
    ['signal', 'mor-sinyal'],
    ['typography', 'iyi-fikir'],
  ] as const)('returns only the matching %s product', (category, id) => {
    expect(filterProducts(products, category).map((product) => product.id)).toEqual([id]);
  });
});
