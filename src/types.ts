export type Side = 'front' | 'back';
export type ShirtColor = 'white' | 'black' | 'beige' | 'purple';
export type ShirtSize = 'S' | 'M' | 'L' | 'XL';
export type ItemKind = 'text' | 'symbol' | 'image';
export type ProductCategory = 'cosmic' | 'anatolia' | 'signal' | 'typography';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  colors: ShirtColor[];
  sizes: ShirtSize[];
  stock: Partial<Record<ShirtColor, Partial<Record<ShirtSize, number>>>>;
  artwork: 'orbit' | 'anatolia' | 'signal' | 'typography';
}

export interface CartItem {
  id: string;
  designHash: string;
  productId: string;
  name: string;
  color: ShirtColor;
  size: ShirtSize;
  quantity: number;
  unitPrice: number;
  artwork: Product['artwork'];
  designPreview?: string;
  isCustom?: boolean;
}

export interface DesignDocument {
  version: string;
  objects: unknown[];
}

export interface DesignSides {
  front: DesignDocument;
  back: DesignDocument;
}

export interface ObjectMeasurement {
  id: string;
  side: Side;
  kind: ItemKind;
  label: string;
  xCm: number;
  yCm: number;
  widthCm: number;
  heightCm: number;
  angle: number;
  detail: string;
  vector: boolean;
  sourcePixels?: { width: number; height: number };
  estimatedPpi?: number;
  quality?: 'suitable' | 'warning' | 'risk';
}

export interface OrderOptions {
  color: ShirtColor;
  size: ShirtSize;
  quantity: number;
}

export interface PriceBreakdown {
  baseUnit: number;
  frontUnit: number;
  backUnit: number;
  subtotal: number;
  discount: number;
  total: number;
}

export interface PreviewImages {
  front: string;
  back: string;
}

export interface MockupPrintArea {
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
}

export interface SavedDraft {
  schemaVersion: 2;
  documents: DesignSides;
  options: OrderOptions;
  activeSide: Side;
  previews?: PreviewImages;
  updatedAt: string;
}
