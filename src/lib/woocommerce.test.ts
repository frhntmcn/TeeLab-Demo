import { describe, expect, it } from 'vitest';
import { getWooCommerceProductOverride, normalizeWooProductKey } from './woocommerce';

describe('WooCommerce product matching', () => {
  it('matches a WooCommerce ASCII slug to the Turkish catalog identifier', () => {
    const overrides = { 'gece-yorungesi': { price: 649, stock: 12 } };
    expect(normalizeWooProductKey('Gece Yörüngesi')).toBe('gece-yorungesi');
    expect(getWooCommerceProductOverride(overrides, 'gece-yörüngesi')).toEqual({ price: 649, stock: 12 });
  });
});
