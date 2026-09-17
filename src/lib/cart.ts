import { cartMergeKey } from './designIdentity';
import { clampOrderQuantity, MAX_ORDER_QUANTITY } from './orderOptions';
import type { CartItem } from '../types';
import { cartLineTotal } from './pricing';
import { brand } from '../config/brand';

export const CART_STORAGE_KEY = `${brand.storageNamespace}-demo-cart-v1`;
export const MAX_CART_QUANTITY = MAX_ORDER_QUANTITY;

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CartItem>;
  return typeof item.id === 'string' && typeof item.productId === 'string' && typeof item.name === 'string'
    && typeof item.designHash === 'string' && typeof item.color === 'string' && typeof item.size === 'string'
    && typeof item.unitPrice === 'number' && Number.isFinite(item.unitPrice) && typeof item.artwork === 'string'
    && typeof item.quantity === 'number' && Number.isFinite(item.quantity) && item.quantity > 0;
}

function normalizePrintSides(item: CartItem): CartItem {
  const printSides = item.printSides;
  if (printSides === undefined || (typeof printSides?.front === 'boolean' && typeof printSides?.back === 'boolean')) return item;
  const withoutPrintSides = { ...item };
  delete withoutPrintSides.printSides;
  return withoutPrintSides;
}

export function deserializeCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem).filter((item) => Math.floor(item.quantity) >= 1).map((item) => ({ ...normalizePrintSides(item), quantity: clampOrderQuantity(item.quantity) }));
  } catch {
    return [];
  }
}

export function serializeCart(items: CartItem[]): string {
  return JSON.stringify(items);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + cartLineTotal(item), 0);
}

export function mergeCartItem(current: CartItem[], next: CartItem): CartItem[] {
  const match = current.find((item) => cartMergeKey(item) === cartMergeKey(next));
  if (!match) return [...current, { ...next, quantity: clampOrderQuantity(next.quantity) }];
  return current.map((item) => item.id === match.id ? { ...item, quantity: clampOrderQuantity(item.quantity + next.quantity) } : item);
}

export function updateCartQuantity(items: CartItem[], id: string, quantity: number): CartItem[] {
  const safeQuantity = Math.floor(quantity);
  if (safeQuantity <= 0) return items.filter((item) => item.id !== id);
  return items.map((item) => item.id === id ? { ...item, quantity: clampOrderQuantity(safeQuantity) } : item);
}
