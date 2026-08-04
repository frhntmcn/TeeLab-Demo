import type { PriceBreakdown } from '../types';

export const formatTRY = (value: number) => new Intl.NumberFormat('tr-TR', {
  style: 'currency', currency: 'TRY', maximumFractionDigits: 0,
}).format(value);

export function calculatePrice(quantity: number, hasFront: boolean, hasBack: boolean): PriceBreakdown {
  const baseUnit = 320;
  const frontUnit = hasFront ? 145 : 0;
  const backUnit = hasBack ? 125 : 0;
  const subtotal = (baseUnit + frontUnit + backUnit) * quantity;
  const discountRate = quantity >= 10 ? 0.12 : quantity >= 5 ? 0.07 : 0;
  const discount = Math.round(subtotal * discountRate);
  return { baseUnit, frontUnit, backUnit, subtotal, discount, total: subtotal - discount };
}

export const round = (value: number) => Math.round(value * 10) / 10;
