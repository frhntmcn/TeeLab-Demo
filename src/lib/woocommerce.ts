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
      return [[slug, { price: Number.isFinite(parsedPrice) ? parsedPrice / 100 : 0, stock }]];
    }));
  } catch {
    return {};
  }
}
