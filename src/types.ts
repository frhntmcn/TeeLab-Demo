export type Side = 'front' | 'back';
export type ShirtColor = 'white' | 'black' | 'beige' | 'purple';
export type ShirtSize = 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type ShirtFit = 'slim' | 'oversize';
export type ItemKind = 'text' | 'symbol' | 'image';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  colors: ShirtColor[];
  artwork: 'orbit' | 'anatolia' | 'signal' | 'typography';
}

export interface CartItem {
  id: string;
  designHash: string;
  productId: string;
  name: string;
  color: ShirtColor;
  size: ShirtSize;
  fit?: ShirtFit;
  quantity: number;
  unitPrice: number;
  printSides?: { front: boolean; back: boolean };
  artwork: Product['artwork'];
  designPreview?: string;
  isCustom?: boolean;
  productionSnapshot?: ProductionSnapshot;
  /** Lines from one Studio design share quantity discount across sizes. */
  designGroupId?: string;
}

export interface DesignDocument {
  version: string;
  objects: unknown[];
}

export interface DesignSides {
  front: DesignDocument;
  back: DesignDocument;
}

export interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  document: DesignDocument;
}

export interface TemplateMetadata {
  id: string;
  name: string;
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

/** Immutable design data kept with a cart line until the server persists it. */
export interface ProductionSnapshot {
  schemaVersion: 1;
  lockedAt: string;
  documents: DesignSides;
  measurements: Record<Side, ObjectMeasurement[]>;
  templateMetadata?: Partial<Record<Side, TemplateMetadata>>;
}

export interface OrderOptions {
  color: ShirtColor;
  size: ShirtSize;
  fit: ShirtFit;
  quantity: number;
  /** Studio multi-size selection; absent in older saved drafts. */
  sizeQuantities?: Partial<Record<ShirtSize, number>>;
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
  templateId?: string;
  templateSide?: Side;
  templateMetadata?: Partial<Record<Side, TemplateMetadata>>;
}
