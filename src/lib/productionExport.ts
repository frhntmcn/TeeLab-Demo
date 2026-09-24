import { FabricObject, StaticCanvas } from 'fabric';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './measurements';
import type { DesignDocument } from '../types';
import { studioFonts } from '../data/studioFonts';

export const PRINT_AREA_CM = { width: 30, height: 40 } as const;
export const PRINT_DPI = 300;
export const PRINT_PIXEL_SIZE = {
  width: Math.round((PRINT_AREA_CM.width / 2.54) * PRINT_DPI),
  height: Math.round((PRINT_AREA_CM.height / 2.54) * PRINT_DPI),
} as const;

export function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function uint32(value: number) {
  return new Uint8Array([(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]);
}

function insertPngResolution(png: Uint8Array) {
  const signatureLength = 8;
  if (png.length < signatureLength + 25 || String.fromCharCode(...png.slice(12, 16)) !== 'IHDR') throw new Error('PNG çıktısı okunamadı.');
  const ihdrEnd = signatureLength + 4 + 4 + 13 + 4;
  const pixelsPerMeter = Math.round(PRINT_DPI / 0.0254);
  const data = new Uint8Array(9);
  data.set(uint32(pixelsPerMeter), 0);
  data.set(uint32(pixelsPerMeter), 4);
  data[8] = 1;
  const type = new TextEncoder().encode('pHYs');
  const crcInput = new Uint8Array(type.length + data.length);
  crcInput.set(type);
  crcInput.set(data, type.length);
  const chunk = new Uint8Array(4 + crcInput.length + 4);
  chunk.set(uint32(data.length), 0);
  chunk.set(crcInput, 4);
  chunk.set(uint32(crc32(crcInput)), 4 + crcInput.length);
  const output = new Uint8Array(png.length + chunk.length);
  output.set(png.slice(0, ihdrEnd));
  output.set(chunk, ihdrEnd);
  output.set(png.slice(ihdrEnd), ihdrEnd + chunk.length);
  return output;
}

export async function exportProductionPng(document: DesignDocument): Promise<Blob> {
  await Promise.all(studioFonts.map((font) => window.document.fonts?.load(`400 16px "${font.family}"`)));
  const element = window.document.createElement('canvas');
  const canvas = new StaticCanvas(element, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, enableRetinaScaling: false, renderOnAddRemove: false });
  try {
    await canvas.loadFromJSON(document);
    canvas.renderAll();
    const multiplier = PRINT_PIXEL_SIZE.width / CANVAS_WIDTH;
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier, enableRetinaScaling: false });
    const encoded = dataUrl.split(',')[1];
    if (!encoded) throw new Error('Şeffaf baskı PNG dosyası oluşturulamadı.');
    const raw = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    const output = insertPngResolution(raw);
    return new Blob([output], { type: 'image/png' });
  } finally {
    await canvas.dispose();
  }
}

// Register custom Fabric fields used by saved production documents.
FabricObject.customProperties = Array.from(new Set([...(FabricObject.customProperties ?? []), 'itemId', 'itemKind', 'itemLabel', 'itemDetail', 'isVector', 'sourcePixelWidth', 'sourcePixelHeight', 'sourceMime', 'itemLocked', 'textCurve']));
