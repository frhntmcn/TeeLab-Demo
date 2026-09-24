import type { OrderOptions, ShirtSize } from '../types';

export const MIN_ORDER_QUANTITY = 1;
/** A UI safety limit only; final availability is always checked by WooCommerce. */
export const MAX_ORDER_QUANTITY = 999;
export const AVAILABLE_SHIRT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;

export function clampOrderQuantity(value: number): number {
  if (!Number.isFinite(value)) return MIN_ORDER_QUANTITY;
  return Math.min(MAX_ORDER_QUANTITY, Math.max(MIN_ORDER_QUANTITY, Math.floor(value)));
}

export function normalizeOrderOptions(options: OrderOptions): OrderOptions {
  const size = AVAILABLE_SHIRT_SIZES.includes(options.size as (typeof AVAILABLE_SHIRT_SIZES)[number]) ? options.size : 'M';
  let remaining = MAX_ORDER_QUANTITY;
  const sizeQuantities = options.sizeQuantities
    ? Object.fromEntries(AVAILABLE_SHIRT_SIZES.map((entry) => {
      const quantity = Math.min(remaining, Math.max(0, Math.floor(Number(options.sizeQuantities?.[entry]) || 0)));
      remaining -= quantity;
      return [entry, quantity];
    })) as Record<ShirtSize, number>
    : { [size]: clampOrderQuantity(options.quantity) } as Partial<Record<ShirtSize, number>>;
  const total = AVAILABLE_SHIRT_SIZES.reduce((sum, entry) => sum + (sizeQuantities[entry] ?? 0), 0);
  return { ...options, size: size as ShirtSize, quantity: total, sizeQuantities };
}

export function sizeEntries(options: OrderOptions): { size: ShirtSize; quantity: number }[] {
  const normalized = normalizeOrderOptions(options);
  return AVAILABLE_SHIRT_SIZES.map((size) => ({ size, quantity: normalized.sizeQuantities?.[size] ?? 0 })).filter((entry) => entry.quantity > 0);
}

export function setSizeQuantity(options: OrderOptions, size: ShirtSize, quantity: number): OrderOptions {
  const normalized = normalizeOrderOptions(options);
  const others = normalized.quantity - (normalized.sizeQuantities?.[size] ?? 0);
  const safe = Math.min(MAX_ORDER_QUANTITY - others, Math.max(0, Math.floor(Number(quantity) || 0)));
  return normalizeOrderOptions({ ...normalized, size, sizeQuantities: { ...normalized.sizeQuantities, [size]: safe } });
}
