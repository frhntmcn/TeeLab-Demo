import { FabricImage, FabricObject } from 'fabric';
import type { ItemKind, ObjectMeasurement, Side } from '../types';
import { round } from './pricing';

export const CANVAS_WIDTH = 360;
export const CANVAS_HEIGHT = 480;
export const PX_PER_CM = 12;

export type MetaObject = FabricObject & {
  itemId?: string; itemKind?: ItemKind; itemLabel?: string; itemDetail?: string; isVector?: boolean;
  sourcePixelWidth?: number; sourcePixelHeight?: number; sourceMime?: string;
  itemLocked?: boolean;
  textCurve?: number;
};

FabricObject.customProperties = ['itemId', 'itemKind', 'itemLabel', 'itemDetail', 'isVector', 'sourcePixelWidth', 'sourcePixelHeight', 'sourceMime', 'itemLocked', 'textCurve'];

export function getMeasurement(object: MetaObject, side: Side): ObjectMeasurement {
  const center = object.getCenterPoint();
  const widthCm = round(object.getScaledWidth() / PX_PER_CM);
  const heightCm = round(object.getScaledHeight() / PX_PER_CM);
  const hasRasterSource = !object.isVector && Boolean(object.sourcePixelWidth && object.sourcePixelHeight);
  const visiblePixelsWidth = object instanceof FabricImage ? object.width : object.sourcePixelWidth;
  const visiblePixelsHeight = object instanceof FabricImage ? object.height : object.sourcePixelHeight;
  const ppiX = hasRasterSource ? visiblePixelsWidth! / (widthCm / 2.54) : undefined;
  const ppiY = hasRasterSource ? visiblePixelsHeight! / (heightCm / 2.54) : undefined;
  const estimatedPpi = ppiX && ppiY ? Math.round(Math.min(ppiX, ppiY)) : undefined;
  const quality = estimatedPpi === undefined ? undefined : estimatedPpi >= 300 ? 'suitable' : estimatedPpi >= 200 ? 'warning' : 'risk';
  return {
    id: object.itemId ?? `obj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    side, kind: object.itemKind ?? 'symbol', label: object.itemLabel ?? 'Tasarım nesnesi',
    xCm: round(center.x / PX_PER_CM), yCm: round(center.y / PX_PER_CM),
    widthCm, heightCm, angle: round(((object.angle ?? 0) % 360 + 360) % 360),
    detail: object.itemDetail ?? 'Vektörel tasarım', vector: object.isVector ?? true,
    sourcePixels: hasRasterSource ? { width: visiblePixelsWidth!, height: visiblePixelsHeight! } : undefined,
    estimatedPpi,
    quality,
  };
}

export function constrainObject(object: MetaObject, width = CANVAS_WIDTH, height = CANVAS_HEIGHT) {
  object.setCoords();
  let rect = object.getBoundingRect();
  if (rect.width > width || rect.height > height) {
    const ratio = Math.min(width / rect.width, height / rect.height) * 0.94;
    object.scaleX = (object.scaleX ?? 1) * ratio;
    object.scaleY = (object.scaleY ?? 1) * ratio;
    object.setCoords();
    rect = object.getBoundingRect();
  }
  let dx = 0;
  let dy = 0;
  if (rect.left < 0) dx = -rect.left;
  if (rect.top < 0) dy = -rect.top;
  if (rect.left + rect.width > width) dx = width - rect.left - rect.width;
  if (rect.top + rect.height > height) dy = height - rect.top - rect.height;
  object.left = (object.left ?? 0) + dx;
  object.top = (object.top ?? 0) + dy;
  object.setCoords();
}
