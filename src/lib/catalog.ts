import type { Product, ProductCategory } from '../types';

export type CatalogFilter = 'all' | ProductCategory;

export function filterProducts(products: readonly Product[], filter: CatalogFilter): Product[] {
  return filter === 'all' ? [...products] : products.filter((product) => product.category === filter);
}
