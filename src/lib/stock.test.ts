import { describe, expect, it } from 'vitest';
import { products } from '../data/products';
import { colorHasStock, getVariantStock, isCartInStock } from './stock';

describe('stock helpers', () => {
  const product = products[0];

  it('returns zero for an unavailable size and keeps that color selectable when other sizes remain', () => {
    expect(getVariantStock(product, 'black', 'XL')).toBe(0);
    expect(colorHasStock(product, 'black')).toBe(true);
  });

  it('rejects cart quantities above a variant stock limit', () => {
    const item = { id: 'line', designHash: 'catalog:orbit', productId: product.id, name: product.name, color: 'black' as const, size: 'L' as const, quantity: 3, unitPrice: product.price, artwork: 'orbit' as const };
    expect(isCartInStock([item], products)).toBe(false);
  });
});
