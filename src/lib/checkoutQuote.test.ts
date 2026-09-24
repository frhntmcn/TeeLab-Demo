import { afterEach, describe, expect, it, vi } from 'vitest';
import { quoteWooCommerceCheckout } from './checkoutQuote';
import type { CartItem } from '../types';

afterEach(() => vi.unstubAllGlobals());

const item: CartItem = { id: 'line-1', designHash: 'catalog:test', productId: 'gece-yörüngesi', name: 'Gece Yörüngesi', color: 'black', size: 'L', quantity: 2, unitPrice: 649, artwork: 'orbit' };

describe('WooCommerce checkout quote', () => {
  it('sends only product identifiers and selected variants to server-side validation', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ subtotal: 1200, currency: 'TRY', note: 'Kargo/vergi sonra hesaplanır.', items: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(quoteWooCommerceCheckout([item])).resolves.toMatchObject({ subtotal: 1200, currency: 'TRY' });
    expect(fetchMock.mock.calls[0][0]).toBe('/wp-json/maymoon/v1/checkout/quote');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ items: [{ productId: 'gece-yörüngesi', color: 'black', size: 'L', quantity: 2 }] });
  });

  it('does not pretend local custom designs can be quoted by WooCommerce', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(quoteWooCommerceCheckout([{ ...item, isCustom: true }])).rejects.toThrow('Özel tasarımlar');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
