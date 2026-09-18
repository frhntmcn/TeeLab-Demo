import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CartItem } from '../types';
import { readDemoOrders, readOrderStatusOverrides, saveDemoOrder, updateDemoOrderStatus } from './orderInbox';

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
  afterEach(() => vi.restoreAllMocks());

  it('moves a completed storefront order into the admin inbox', () => {
    const order = saveDemoOrder({ name: 'Test Müşteri', phone: '05555555555', email: 'test@example.com', address: 'Test adresi' }, [cartItem]);
    expect(readDemoOrders()[0]).toMatchObject({ id: order.id, customer: 'Test Müşteri', detail: 'Beyaz · M beden · 2 adet', status: 'Yeni sipariş', total: 1198 });
  });

  it('creates unique order references even in the same millisecond', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    const first = saveDemoOrder({ name: 'Bir', phone: '1', email: 'bir@example.com', address: 'Adres' }, [cartItem]);
    const second = saveDemoOrder({ name: 'İki', phone: '2', email: 'iki@example.com', address: 'Adres' }, [cartItem]);
    expect(first.id).not.toBe(second.id);
  });

  it('updates the persisted order status', () => {
    const order = saveDemoOrder({ name: 'Test Müşteri', phone: '05555555555', email: 'test@example.com', address: 'Test adresi' }, [cartItem]);
    updateDemoOrderStatus(order.id, 'Baskıda');
    expect(readDemoOrders()[0].status).toBe('Baskıda');
  });

  it('persists a status override for sample orders', () => {
    updateDemoOrderStatus('#2048', 'Kargoya verildi');
    expect(readOrderStatusOverrides()['#2048']).toBe('Kargoya verildi');
  });
});
