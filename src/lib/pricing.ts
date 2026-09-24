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

export function cartLineTotal(item: Pick<CartItem, 'unitPrice' | 'quantity' | 'printSides' | 'designGroupId'>, allItems?: CartItem[]): number {
  if (item.designGroupId && allItems) {
    const group = allItems.filter((line) => line.designGroupId === item.designGroupId);
    const groupQuantity = group.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = group.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const rate = pricingConfig.quantityDiscounts.find((discount) => groupQuantity >= discount.minimumQuantity)?.rate ?? 0;
    const discount = Math.round(subtotal * rate);
    const index = group.findIndex((line) => line === item);
    if (index >= 0 && subtotal > 0) {
      const allocated = index === group.length - 1
        ? discount - group.slice(0, -1).reduce((sum, line) => sum + Math.floor(discount * line.unitPrice * line.quantity / subtotal), 0)
        : Math.floor(discount * item.unitPrice * item.quantity / subtotal);
      return item.unitPrice * item.quantity - allocated;
    }
  }
  return item.printSides
    ? calculatePrice(item.quantity, item.printSides.front, item.printSides.back).total
    : item.unitPrice * item.quantity;
}

export const round = (value: number) => Math.round(value * 10) / 10;
