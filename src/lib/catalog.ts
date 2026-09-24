import type { ManagedProductRecord } from './storefrontManagement';

export type CatalogSort = 'featured' | 'price-ascending' | 'price-descending';

export function filterAndSortCatalog(records: ManagedProductRecord[], query: string, sort: CatalogSort = 'featured') {
  const normalized = query.trim().toLocaleLowerCase('tr-TR');
  const filtered = normalized
    ? records.filter(({ product, category }) => `${product.name} ${product.description} ${category ?? 'Tişört'}`.toLocaleLowerCase('tr-TR').includes(normalized))
    : [...records];
  if (sort === 'price-ascending') return filtered.sort((a, b) => a.product.price - b.product.price);
  if (sort === 'price-descending') return filtered.sort((a, b) => b.product.price - a.product.price);
  return filtered;
}
