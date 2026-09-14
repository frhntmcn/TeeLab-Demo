import { describe, expect, it } from 'vitest';
import { cartSubtotal, deserializeCart, mergeCartItem, serializeCart, updateCartQuantity } from './cart';
import type { CartItem } from '../types';

const item = (designHash: string, quantity = 1): CartItem => ({ id: `${designHash}-${quantity}`, designHash, productId: 'custom-design', name: 'Kendin Tasarla', color: 'white', size: 'M', quantity, unitPrice: 500, artwork: 'typography', isCustom: true });

describe('mergeCartItem', () => {
  it('merges identical design identities', () => {
    expect(mergeCartItem([item('d-same', 1)], item('d-same', 2))).toHaveLength(1);
    expect(mergeCartItem([item('d-same', 1)], item('d-same', 2))[0].quantity).toBe(3);
  });

  it('keeps different designs as separate cart lines', () => {
    expect(mergeCartItem([item('d-one')], item('d-two'))).toHaveLength(2);
  });

  it('keeps variants separate and bounds quantity updates safely', () => {
    const base = item('d-same'); const black = { ...item('d-same'), id: 'black', color: 'black' as const };
    expect(mergeCartItem([base], black)).toHaveLength(2);
    expect(updateCartQuantity([base], base.id, 0)).toEqual([]);
    expect(updateCartQuantity([base], base.id, -3)).toEqual([]);
    expect(updateCartQuantity([base], base.id, 99)[0].quantity).toBe(25);
  });

  it('serializes valid carts and safely rejects corrupted or incomplete storage', () => {
    const cart = [item('d-storage', 2)];
    expect(deserializeCart(serializeCart(cart))).toEqual(cart);
    expect(deserializeCart('{broken')).toEqual([]);
    expect(deserializeCart(JSON.stringify([{ id: 'missing-fields' }]))).toEqual([]);
    expect(deserializeCart(JSON.stringify([{ ...item('d-fractional'), quantity: 0.5 }]))).toEqual([]);
    expect(deserializeCart(JSON.stringify([{ ...item('d-zero'), quantity: 0 }, { ...item('d-nan'), quantity: null }]))).toEqual([]);
    expect(deserializeCart(JSON.stringify([{ ...item('d-large'), quantity: 99 }]))[0].quantity).toBe(25);
    expect(deserializeCart(JSON.stringify([{ ...item('d-print'), printSides: { front: 'yes', back: false } }]))[0].printSides).toBeUndefined();
    expect(deserializeCart(JSON.stringify([{ ...item('d-null-print'), printSides: null }]))[0].printSides).toBeUndefined();
  });

  it('recalculates the subtotal from each cart update', () => {
    expect(cartSubtotal([item('d-one', 2), { ...item('d-two', 3), unitPrice: 200 }])).toBe(1600);
  });

  it('recalculates merged custom designs using their current quantity discount', () => {
    const custom = { ...item('d-merge', 4), unitPrice: 590, printSides: { front: true, back: true } };
    const merged = mergeCartItem([custom], { ...custom, id: 'd-merge-next', quantity: 1 });
    expect(merged).toHaveLength(1);
    expect(cartSubtotal(merged)).toBe(2743);
  });

  it('keeps custom designs with distinct hashes or fits as separate discounted lines', () => {
    const first = { ...item('d-one', 5), unitPrice: 465, fit: 'slim' as const, printSides: { front: true, back: false } };
    const second = { ...first, id: 'd-two', designHash: 'd-two', fit: 'oversize' as const };
    expect(mergeCartItem([first], second)).toHaveLength(2);
    expect(cartSubtotal([first, second])).toBe(4324);
  });
});
