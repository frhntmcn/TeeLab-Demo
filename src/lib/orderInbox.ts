import { brand } from '../config/brand';
import type { CheckoutFormValues } from './checkout';
import { cartSubtotal } from './cart';
import type { CartItem } from '../types';

export const ORDER_INBOX_EVENT = `${brand.storageNamespace}:order-inbox-change`;
const STORAGE_KEY = `${brand.storageNamespace}:demo-orders:v1`;

export type AdminOrderStatus = 'Yeni sipariş' | 'Üretime hazır' | 'Baskıda' | 'Kargoya verildi';

export interface AdminOrder {
  id: string;
  customer: string;
  email: string;
  product: string;
  detail: string;
  total: number;
  status: AdminOrderStatus;
  createdAt: string;
}

export function readDemoOrders(): AdminOrder[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOrders(orders: AdminOrder[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent(ORDER_INBOX_EVENT));
}

export function saveDemoOrder(values: CheckoutFormValues, items: CartItem[]) {
  const quantity = items.reduce((total, item) => total + item.quantity, 0);
  const first = items[0];
  const order: AdminOrder = {
    id: `#${Date.now().toString().slice(-6)}`,
    customer: values.name.trim(),
    email: values.email.trim(),
    product: first ? `${first.name}${items.length > 1 ? ` +${items.length - 1} ürün` : ''}` : 'Demo sipariş',
    detail: `${quantity} adet · Mağazadan oluşturuldu`,
    total: cartSubtotal(items),
    status: 'Yeni sipariş',
    createdAt: new Date().toISOString(),
  };
  writeOrders([order, ...readDemoOrders()].slice(0, 50));
  return order;
}

export function updateDemoOrderStatus(id: string, status: AdminOrderStatus) {
  writeOrders(readDemoOrders().map((order) => order.id === id ? { ...order, status } : order));
}
