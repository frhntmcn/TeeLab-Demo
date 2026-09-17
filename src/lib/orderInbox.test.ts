import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CartItem } from '../types';
import { readDemoOrders, saveDemoOrder, updateDemoOrderStatus } from './orderInbox';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  clear() { this.values.clear(); }
}

const storage = new MemoryStorage();
vi.stubGlobal('window', { localStorage: storage, dispatchEvent: vi.fn() });

const cartItem: CartItem = {
  id: 'cart-1', designHash: 'hash', productId: 'iyi-fikir', name: 'İyi Fikir', color: 'white', size: 'M', quantity: 2, unitPrice: 599, artwork: 'typography',
};

describe('order inbox', () => {
  beforeEach(() => storage.clear());

  it('moves a completed storefront order into the admin inbox', () => {
    const order = saveDemoOrder({ name: 'Test Müşteri', phone: '05555555555', email: 'test@example.com', address: 'Test adresi' }, [cartItem]);
    expect(readDemoOrders()[0]).toMatchObject({ id: order.id, customer: 'Test Müşteri', status: 'Yeni sipariş', total: 1198 });
  });

  it('updates the persisted order status', () => {
    const order = saveDemoOrder({ name: 'Test Müşteri', phone: '05555555555', email: 'test@example.com', address: 'Test adresi' }, [cartItem]);
    updateDemoOrderStatus(order.id, 'Baskıda');
    expect(readDemoOrders()[0].status).toBe('Baskıda');
  });
});
