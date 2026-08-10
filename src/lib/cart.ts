import { cartMergeKey } from './designIdentity';
import type { CartItem } from '../types';

export function mergeCartItem(current: CartItem[], next: CartItem): CartItem[] {
  const match = current.find((item) => cartMergeKey(item) === cartMergeKey(next));
  if (!match) return [...current, next];
  return current.map((item) => item.id === match.id ? { ...item, quantity: item.quantity + next.quantity } : item);
}
