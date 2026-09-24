import type { Product } from '../types';

type WooProduct = {
  slug?: string;
  name?: string;
  price?: string;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity?: number | null;
};

export type WooCommerceProductOverride = Pick<Product, 'price'> & { stock: number };

/**
 * WooCommerce URL slugs transliterate Turkish characters (for example
 * `gece-yörüngesi` becomes `gece-yorungesi`).  The React catalog deliberately
 * keeps Turkish product identifiers, so both sources are compared through the
 * same safe URL-key representation.
 */
export function normalizeWooProductKey(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getWooCommerceProductOverride(overrides: Record<string, WooCommerceProductOverride>, productId: string) {
  return overrides[normalizeWooProductKey(productId)];
}

/**
 * Reads the public WooCommerce Store API. Draft products are intentionally not
 * returned by WooCommerce, so an empty response keeps the local demo catalog.
 */
export async function fetchWooCommerceProductOverrides(): Promise<Record<string, WooCommerceProductOverride>> {
  try {
    const response = await fetch('/wp-json/wc/store/v1/products?per_page=100', { headers: { Accept: 'application/json' } });
    if (!response.ok) return {};
    const items = await response.json() as WooProduct[];
    return Object.fromEntries(items.flatMap((item) => {
      const slug = item.slug;
      if (!slug) return [];
      const parsedPrice = Number.parseFloat(item.price ?? '');
      const stock = item.stock_status === 'outofstock' ? 0 : (item.stock_quantity ?? 20);
      return [[normalizeWooProductKey(slug), { price: Number.isFinite(parsedPrice) ? parsedPrice / 100 : 0, stock }]];
    }));
  } catch {
    return {};
  }
}
