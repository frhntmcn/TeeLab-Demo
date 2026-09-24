import { getAdminRestNonce } from './adminSession';
import type { AdminOrder, AdminOrderStatus } from './orderInbox';

type WooAdminOrder = {
  id: number;
  number: string;
  date: string;
  status: string;
  customer: string;
  email: string;
  total: number;
  currency: string;
  customer_note?: string;
  is_paid: boolean;
  items: { name: string; quantity: number; product_id: number; variation_id: number }[];
};

const endpoint = (path: string) => `/wp-json/maymoon/v1/admin/${path}`;

const statusFromWoo: Record<string, AdminOrderStatus> = {
  pending: 'Yeni sipariş',
  'on-hold': 'Yeni sipariş',
  failed: 'Ödeme başarısız',
  processing: 'Üretime hazır',
  'maymoon-design-review': 'Yeni sipariş',
  'maymoon-production-waiting': 'Üretime hazır',
  'maymoon-production': 'Baskıda',
  'maymoon-shipped': 'Kargoya verildi',
  completed: 'Tamamlandı',
  cancelled: 'İptal edildi',
  refunded: 'İade edildi',
};

const statusToWoo: Record<AdminOrderStatus, string> = {
  'Yeni sipariş': 'pending',
  'Ödeme başarısız': 'failed',
  'Üretime hazır': 'maymoon-production-waiting',
  Baskıda: 'maymoon-production',
  'Kargoya verildi': 'maymoon-shipped',
  Tamamlandı: 'completed',
  'İptal edildi': 'cancelled',
  'İade edildi': 'refunded',
};

function mapOrder(order: WooAdminOrder): AdminOrder {
  return {
    id: `#${order.number}`,
    remoteId: order.id,
    customer: order.customer || 'Misafir müşteri',
    email: order.email,
    product: order.items.map((item) => item.name).join(', ') || 'Ürün bilgisi yok',
    detail: order.items.map((item) => `${item.name} · ${item.quantity} adet`).join(' / '),
    total: Number(order.total),
    status: statusFromWoo[order.status] ?? 'Yeni sipariş',
    createdAt: order.date,
    paid: order.is_paid,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const nonce = getAdminRestNonce();
  const response = await fetch(endpoint(path), {
    ...init,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(nonce ? { 'X-WP-Nonce': nonce } : {}),
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => ({})) as T & { message?: string };
  if (!response.ok) throw new Error(body.message ?? 'WooCommerce mağaza verisi alınamadı.');
  return body;
}

export async function getWooCommerceAdminOrders(): Promise<AdminOrder[]> {
  const result = await request<{ orders: WooAdminOrder[] }>('orders');
  return result.orders.map(mapOrder);
}

export async function updateWooCommerceAdminOrderStatus(orderId: number, status: AdminOrderStatus): Promise<AdminOrder> {
  const order = await request<WooAdminOrder>(`orders/${encodeURIComponent(orderId)}/status`, {
    method: 'POST',
    body: JSON.stringify({ status: statusToWoo[status] }),
  });
  return mapOrder(order);
}
