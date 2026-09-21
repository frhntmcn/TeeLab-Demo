import { brand } from '../config/brand';
import type { Product, ShirtSize } from '../types';

export const STOREFRONT_MANAGEMENT_EVENT = `${brand.storageNamespace}:storefront-management-change`;
const STORAGE_KEY = `${brand.storageNamespace}:storefront-management:v1`;

export interface ManagedProductRecord {
  product: Product;
  visible: boolean;
  stock: number;
  custom: boolean;
  category?: string;
  imageDataUrl?: string;
  variants: ProductVariant[];
}

export interface ProductVariant {
  color: string;
  hex: string;
  sizeStocks: Record<ShirtSize, number>;
}

export interface NewManagedProduct {
  name: string;
  description: string;
  price: number;
  category: string;
  imageDataUrl?: string;
  variants: ProductVariant[];
  visible: boolean;
}

type StoredCustomProduct = Product & {
  category?: string;
  imageDataUrl?: string;
  variants?: ProductVariant[];
};

interface StorefrontManagementState {
  productSettings: Record<string, { visible: boolean; stock: number }>;
  customProducts: StoredCustomProduct[];
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
    const customProduct = state.customProducts.find((item) => item.id === product.id);
    const variants = customProduct?.variants ?? [];
    const variantStock = variants.length ? variants.reduce((total, variant) => total + Object.values(variant.sizeStocks).reduce((subtotal, stock) => subtotal + stock, 0), 0) : undefined;
    return {
      product,
      visible: setting?.visible ?? true,
      stock: setting?.stock ?? variantStock ?? 20,
      custom: Boolean(customProduct),
      category: customProduct?.category,
      imageDataUrl: customProduct?.imageDataUrl,
      variants,
    };
  });
}

export function getVisibleStorefrontProducts(baseProducts: Product[]) {
  return getManagedProductRecords(baseProducts).filter((item) => item.visible).map((item) => item.product);
}

export function getStorefrontProductRecord(baseProducts: Product[], productId: string) {
  return getManagedProductRecords(baseProducts).find((item) => item.visible && item.product.id === productId);
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

export function createManagedProduct(input: NewManagedProduct) {
  const state = readStorefrontManagement();
  const baseId = input.name.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'yeni-urun';
  let id = baseId;
  let suffix = 2;
  const ids = new Set(state.customProducts.map((product) => product.id));
  while (ids.has(id)) id = `${baseId}-${suffix++}`;
  const product: StoredCustomProduct = {
    id,
    name: input.name.trim(),
    description: input.description.trim(),
    price: Math.max(1, Math.round(input.price)),
    colors: ['white', 'black'],
    artwork: 'typography',
    category: input.category.trim(),
    imageDataUrl: input.imageDataUrl,
    variants: input.variants,
  };
  state.customProducts.push(product);
  const totalStock = input.variants.reduce((total, variant) => total + Object.values(variant.sizeStocks).reduce((subtotal, stock) => subtotal + stock, 0), 0);
  state.productSettings[id] = { visible: input.visible, stock: totalStock };
  writeStorefrontManagement(state);
  return product;
}
