import type { OrderOptions, ShirtSize } from '../types';

export const MIN_ORDER_QUANTITY = 1;
export const MAX_ORDER_QUANTITY = 25;
export const AVAILABLE_SHIRT_SIZES = ['S', 'M', 'L', 'XL'] as const;

export function clampOrderQuantity(value: number): number {
  if (!Number.isFinite(value)) return MIN_ORDER_QUANTITY;
  return Math.min(MAX_ORDER_QUANTITY, Math.max(MIN_ORDER_QUANTITY, Math.floor(value)));
}

export function normalizeOrderOptions(options: OrderOptions): OrderOptions {
  const size = AVAILABLE_SHIRT_SIZES.includes(options.size as (typeof AVAILABLE_SHIRT_SIZES)[number]) ? options.size : 'M';
  return { ...options, size: size as ShirtSize, quantity: clampOrderQuantity(options.quantity) };
}
