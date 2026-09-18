import { brand } from '../config/brand';
import { colorNames } from '../data/products';
import type { CheckoutFormValues } from './checkout';
import { cartSubtotal } from './cart';
import type { CartItem } from '../types';

export const ORDER_INBOX_EVENT = `${brand.storageNamespace}:order-inbox-change`;
const STORAGE_KEY = `${brand.storageNamespace}:demo-orders:v1`;
const STATUS_STORAGE_KEY = `${brand.storageNamespace}:sample-order-statuses:v1`;

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

const orderStatuses: AdminOrderStatus[] = ['Yeni sipariş', 'Üretime hazır', 'Baskıda', 'Kargoya verildi'];

function isOrderStatus(value: unknown): value is AdminOrderStatus {
  return typeof value === 'string' && orderStatuses.includes(value as AdminOrderStatus);
}

function createOrderId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const uuid = globalThis.crypto.randomUUID?.();
  const random = uuid
    ? uuid.replaceAll('-', '').slice(0, 8).toUpperCase()
    : [...globalThis.crypto.getRandomValues(new Uint32Array(2))].map((value) => value.toString(36).toUpperCase()).join('').slice(0, 8);
  return `#${timestamp}-${random}`;
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

export function readOrderStatusOverrides(): Record<string, AdminOrderStatus> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STATUS_STORAGE_KEY) ?? '{}') as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, AdminOrderStatus] => isOrderStatus(entry[1])));
  } catch {
    return {};
  }
}

export function saveDemoOrder(values: CheckoutFormValues, items: CartItem[]) {
  const quantity = items.reduce((total, item) => total + item.quantity, 0);
  const first = items[0];
  const order: AdminOrder = {
    id: createOrderId(),
    customer: values.name.trim(),
    email: values.email.trim(),
    product: first ? `${first.name}${items.length > 1 ? ` +${items.length - 1} ürün` : ''}` : 'Demo sipariş',
    detail: first ? `${colorNames[first.color]} · ${first.size} beden · ${quantity} adet` : 'Demo sipariş',
    total: cartSubtotal(items),
    status: 'Yeni sipariş',
    createdAt: new Date().toISOString(),
  };
  writeOrders([order, ...readDemoOrders()].slice(0, 50));
  return order;
}

export function updateDemoOrderStatus(id: string, status: AdminOrderStatus) {
  const orders = readDemoOrders();
  if (orders.some((order) => order.id === id)) {
    writeOrders(orders.map((order) => order.id === id ? { ...order, status } : order));
    return;
  }
  const overrides = readOrderStatusOverrides();
  window.localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify({ ...overrides, [id]: status }));
  window.dispatchEvent(new CustomEvent(ORDER_INBOX_EVENT));
}
