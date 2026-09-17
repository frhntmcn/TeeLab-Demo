import { beforeEach, describe, expect, it, vi } from 'vitest';
import { products } from '../data/products';
import { createManagedProduct, filterManagedProducts, getManagedProductRecords, getVisibleStorefrontProducts, updateManagedProduct } from './storefrontManagement';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  clear() { this.values.clear(); }
}

const storage = new MemoryStorage();
vi.stubGlobal('window', { localStorage: storage, dispatchEvent: vi.fn() });

describe('storefront management', () => {
  beforeEach(() => storage.clear());

  it('hides a managed product from the storefront', () => {
    updateManagedProduct(products[0].id, { visible: false });
    expect(getVisibleStorefrontProducts(products).some((product) => product.id === products[0].id)).toBe(false);
  });

  it('creates a visible custom product with stock', () => {
    const created = createManagedProduct('Yeni Ay', 'Yeni koleksiyon ürünü.', 700);
    const record = getManagedProductRecords(products).find((item) => item.product.id === created.id);
    expect(record).toMatchObject({ visible: true, stock: 20, custom: true });
    expect(getVisibleStorefrontProducts(products).some((product) => product.id === created.id)).toBe(true);
  });

  it('filters managed products by Turkish name and description', () => {
    const records = getManagedProductRecords(products);
    expect(filterManagedProducts(records, 'Gece').map((item) => item.product.name)).toEqual(['Gece Yörüngesi']);
    expect(filterManagedProducts(records, 'Sinyal').map((item) => item.product.name)).toEqual(['Mor Sinyal']);
    expect(filterManagedProducts(records, 'çağdaş').map((item) => item.product.name)).toEqual(['Anadolu Form']);
  });

  it('removes zero-stock products from the storefront', () => {
    updateManagedProduct(products[1].id, { stock: 0 });
    expect(getVisibleStorefrontProducts(products).some((product) => product.id === products[1].id)).toBe(false);
  });
});
