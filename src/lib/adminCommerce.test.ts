import { afterEach, describe, expect, it, vi } from 'vitest';
import { getWooCommerceAdminOrders, updateWooCommerceAdminOrderStatus } from './adminCommerce';

afterEach(() => vi.unstubAllGlobals());

describe('WooCommerce administration API', () => {
  it('maps WooCommerce orders into the management panel format', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ orders: [{
      id: 73, number: '2048', date: '2026-09-20T12:00:00', status: 'maymoon-production', customer: 'Ada Yılmaz', email: 'ada@example.com', total: '1298.00', currency: 'TRY',
      items: [{ name: 'Gece Yörüngesi — Siyah, L', quantity: 2, product_id: 12, variation_id: 13 }],
    }] }), { status: 200, headers: { 'Content-Type': 'application/json' } })));

    await expect(getWooCommerceAdminOrders()).resolves.toEqual([{
      id: '#2048', remoteId: 73, customer: 'Ada Yılmaz', email: 'ada@example.com', product: 'Gece Yörüngesi — Siyah, L',
      detail: 'Gece Yörüngesi — Siyah, L · 2 adet', total: 1298, status: 'Baskıda', createdAt: '2026-09-20T12:00:00',
    }]);
  });

  it('sends status updates to the protected WooCommerce endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 73, number: '2048', date: '2026-09-20T12:00:00', status: 'maymoon-shipped', customer: 'Ada Yılmaz', email: 'ada@example.com', total: '1298.00', currency: 'TRY', items: [],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const updated = await updateWooCommerceAdminOrderStatus(73, 'Kargoya verildi');

    expect(fetchMock.mock.calls[0][0]).toBe('/wp-json/maymoon/v1/admin/orders/73/status');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ status: 'maymoon-shipped' });
    expect(updated.status).toBe('Kargoya verildi');
  });
});
