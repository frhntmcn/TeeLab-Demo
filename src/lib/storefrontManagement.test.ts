import { beforeEach, describe, expect, it, vi } from 'vitest';
import { products } from '../data/products';
import { createManagedProduct, filterManagedProducts, getManagedProductRecords, getStorefrontProductRecord, getVisibleStorefrontProducts, updateManagedProduct } from './storefrontManagement';

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
    const created = createManagedProduct({ name: 'Yeni Ay', description: 'Yeni koleksiyon ürünü.', price: 700, category: 'Tişört', visible: true, variants: [] });
    const record = getManagedProductRecords(products).find((item) => item.product.id === created.id);
    expect(record).toMatchObject({ visible: true, stock: 0, custom: true });
    expect(created.artwork).toBe('typography');
    expect(getVisibleStorefrontProducts(products).some((product) => product.id === created.id)).toBe(true);
  });

  it('filters managed products by Turkish name and description', () => {
    const records = getManagedProductRecords(products);
    expect(filterManagedProducts(records, 'Gece').map((item) => item.product.name)).toEqual(['Gece Yörüngesi']);
    expect(filterManagedProducts(records, 'Sinyal').map((item) => item.product.name)).toEqual(['Mor Sinyal']);
    expect(filterManagedProducts(records, 'çağdaş').map((item) => item.product.name)).toEqual(['Anadolu Form']);
  });

  it('keeps a visible zero-stock product in the storefront record', () => {
    updateManagedProduct(products[1].id, { stock: 0 });
    expect(getVisibleStorefrontProducts(products).some((product) => product.id === products[1].id)).toBe(true);
    expect(getStorefrontProductRecord(products, products[1].id)?.stock).toBe(0);
  });

  it('removes a product only when visibility is disabled', () => {
    updateManagedProduct(products[1].id, { visible: false });
    expect(getStorefrontProductRecord(products, products[1].id)).toBeUndefined();
  });
});
