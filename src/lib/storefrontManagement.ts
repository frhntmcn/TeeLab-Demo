import { brand } from '../config/brand';
import type { Product } from '../types';

export const STOREFRONT_MANAGEMENT_EVENT = `${brand.storageNamespace}:storefront-management-change`;
const STORAGE_KEY = `${brand.storageNamespace}:storefront-management:v1`;

export interface ManagedProductRecord {
  product: Product;
  visible: boolean;
  stock: number;
  custom: boolean;
}

interface StorefrontManagementState {
  productSettings: Record<string, { visible: boolean; stock: number }>;
  customProducts: Product[];
}

const emptyState = (): StorefrontManagementState => ({ productSettings: {}, customProducts: [] });

export function readStorefrontManagement(): StorefrontManagementState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<StorefrontManagementState>;
    return {
      productSettings: parsed.productSettings && typeof parsed.productSettings === 'object' ? parsed.productSettings : {},
      customProducts: Array.isArray(parsed.customProducts) ? parsed.customProducts : [],
    };
  } catch {
    return emptyState();
  }
}

function writeStorefrontManagement(state: StorefrontManagementState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(STOREFRONT_MANAGEMENT_EVENT));
}

export function getManagedProductRecords(baseProducts: Product[]): ManagedProductRecord[] {
  const state = readStorefrontManagement();
  return [...baseProducts, ...state.customProducts].map((product) => {
    const setting = state.productSettings[product.id];
    return {
      product,
      visible: setting?.visible ?? true,
      stock: setting?.stock ?? 20,
      custom: state.customProducts.some((item) => item.id === product.id),
    };
  });
}

export function getVisibleStorefrontProducts(baseProducts: Product[]) {
  return getManagedProductRecords(baseProducts).filter((item) => item.visible && item.stock > 0).map((item) => item.product);
}

export function filterManagedProducts(records: ManagedProductRecord[], query: string) {
  const normalized = query.trim().toLocaleLowerCase('tr-TR');
  if (!normalized) return records;
  return records.filter(({ product }) => `${product.name} ${product.description}`.toLocaleLowerCase('tr-TR').includes(normalized));
}

export function updateManagedProduct(productId: string, update: Partial<Pick<ManagedProductRecord, 'visible' | 'stock'>>) {
  const state = readStorefrontManagement();
  const current = state.productSettings[productId] ?? { visible: true, stock: 20 };
  state.productSettings[productId] = {
    visible: update.visible ?? current.visible,
    stock: Math.max(0, Math.min(999, Math.round(update.stock ?? current.stock))),
  };
  writeStorefrontManagement(state);
}

export function createManagedProduct(name: string, description: string, price: number) {
  const state = readStorefrontManagement();
  const baseId = name.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'yeni-urun';
  let id = baseId;
  let suffix = 2;
  const ids = new Set(state.customProducts.map((product) => product.id));
  while (ids.has(id)) id = `${baseId}-${suffix++}`;
  const product: Product = {
    id,
    name: name.trim(),
    description: description.trim(),
    price: Math.max(1, Math.round(price)),
    colors: ['white', 'black'],
    artwork: 'typography',
  };
  state.customProducts.push(product);
  state.productSettings[id] = { visible: true, stock: 20 };
  writeStorefrontManagement(state);
  return product;
}
