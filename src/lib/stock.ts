import type { CartItem, Product, ShirtColor, ShirtSize } from '../types';

export function getVariantStock(product: Product, color: ShirtColor, size: ShirtSize): number {
  return product.stock[color]?.[size] ?? 0;
}

export function colorHasStock(product: Product, color: ShirtColor): boolean {
  return product.sizes.some((size) => getVariantStock(product, color, size) > 0);
}

export function firstAvailableSize(product: Product, color: ShirtColor): ShirtSize {
  return product.sizes.find((size) => getVariantStock(product, color, size) > 0) ?? product.sizes[0];
}

export function isCartInStock(items: CartItem[], products: Product[]): boolean {
  return items.filter((item) => !item.isCustom).every((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return Boolean(product && item.quantity <= getVariantStock(product, item.color, item.size));
  });
}
