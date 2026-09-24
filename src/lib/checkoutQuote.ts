import type { CartItem } from '../types';
import { getCustomerRestNonce } from './customerSession';

export interface CheckoutQuote {
  subtotal: number;
  currency: string;
  note: string;
  items: { product_id: number; name: string; quantity: number; unit_price: number; line_total: number; stock_quantity: number | null }[];
}

export async function quoteWooCommerceCheckout(items: CartItem[]): Promise<CheckoutQuote> {
  if (!items.length) throw new Error('Sepetiniz boş.');
  if (items.some((item) => item.isCustom)) throw new Error('Özel tasarımlar için WooCommerce üretim siparişi bağlantısı henüz kurulmadı. Tasarım kaybolmaz; ödeme şu anda alınamaz.');
  const nonce = getCustomerRestNonce();
  const response = await fetch('/wp-json/maymoon/v1/checkout/quote', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(nonce ? { 'X-WP-Nonce': nonce } : {}) },
    body: JSON.stringify({ items: items.map(({ productId, color, size, quantity }) => ({ productId, color, size, quantity })) }),
  });
  const body = await response.json().catch(() => ({})) as CheckoutQuote & { message?: string };
  if (!response.ok) throw new Error(body.message ?? 'Ürün fiyatı ve stoğu WooCommerce üzerinden doğrulanamadı.');
  return body;
}
