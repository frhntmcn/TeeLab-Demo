import { describe, expect, it } from 'vitest';
import { products } from '../data/products';
import type { ManagedProductRecord } from './storefrontManagement';
import { filterAndSortCatalog } from './catalog';

describe('catalog filtering and sorting', () => {
  const records: ManagedProductRecord[] = products.map((product) => ({ product, visible: true, stock: 10, custom: false, category: 'Tişört', variants: [] }));

  it('searches Turkish product names and descriptions', () => {
    expect(filterAndSortCatalog(records, 'yörünge').map(({ product }) => product.id)).toEqual(['gece-yörüngesi']);
    expect(filterAndSortCatalog(records, 'geleneksel').map(({ product }) => product.id)).toEqual(['anadolu-form']);
  });

  it('sorts by price without changing the original catalog order', () => {
    expect(filterAndSortCatalog(records, '', 'price-ascending').map(({ product }) => product.price)).toEqual([599, 629, 649, 679]);
    expect(filterAndSortCatalog(records, '').map(({ product }) => product.id)).toEqual(products.map(({ id }) => id));
  });
});
