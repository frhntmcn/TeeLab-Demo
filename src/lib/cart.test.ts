import { describe, expect, it } from 'vitest';
import { mergeCartItem } from './cart';
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
});
