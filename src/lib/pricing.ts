import type { CartItem, PriceBreakdown } from '../types';
import { pricingConfig, type PricingConfig } from '../config/pricing';
import { clampOrderQuantity } from './orderOptions';

export const formatTRY = (value: number) => new Intl.NumberFormat('tr-TR', {
  style: 'currency', currency: 'TRY', maximumFractionDigits: 0,
}).format(value);

export function calculatePrice(quantity: number, hasFront: boolean, hasBack: boolean, config: PricingConfig = pricingConfig): PriceBreakdown {
  const safeQuantity = clampOrderQuantity(quantity);
  const baseUnit = config.baseUnit;
  const frontUnit = hasFront ? config.frontPrintUnit : 0;
  const backUnit = hasBack ? config.backPrintUnit : 0;
  const subtotal = (baseUnit + frontUnit + backUnit) * safeQuantity;
  const discountRate = config.quantityDiscounts.find((discount) => safeQuantity >= discount.minimumQuantity)?.rate ?? 0;
  const discount = Math.round(subtotal * discountRate);
  return { baseUnit, frontUnit, backUnit, subtotal, discount, total: subtotal - discount };
}

export function cartLineTotal(item: Pick<CartItem, 'unitPrice' | 'quantity' | 'printSides'>): number {
  return item.printSides
    ? calculatePrice(item.quantity, item.printSides.front, item.printSides.back).total
    : item.unitPrice * item.quantity;
}

export const round = (value: number) => Math.round(value * 10) / 10;
