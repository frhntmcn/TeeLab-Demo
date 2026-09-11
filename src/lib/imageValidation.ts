export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_EDGE = 8000;
export const MAX_IMAGE_PIXELS = 40_000_000;

export type UploadFormat = 'png' | 'jpeg' | 'webp' | 'heic' | 'svg' | 'gif' | 'unknown';
export type UploadIssue = 'unsupported' | 'svg' | 'gif' | 'size' | 'dimensions' | 'decode';

const startsWith = (bytes: Uint8Array, values: number[]) => values.every((value, index) => bytes[index] === value);

export function detectUploadFormat(bytes: Uint8Array): UploadFormat {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return 'gif';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'webp';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp') {
    const brand = String.fromCharCode(...bytes.slice(8, 12)).toLowerCase();
    if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand)) return 'heic';
  }
  return 'unknown';
}

export async function validateUploadFile(file: File): Promise<{ format?: Exclude<UploadFormat, 'svg' | 'gif' | 'unknown'>; issue?: UploadIssue }> {
  if (file.size > MAX_UPLOAD_BYTES) return { issue: 'size' };
  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const format = detectUploadFormat(bytes);
  if (format === 'svg' || file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) return { issue: 'svg' };
  if (format === 'gif') return { issue: 'gif' };
  if (format === 'unknown') return { issue: 'unsupported' };
  return { format };
}

export function validateDimensions(width: number, height: number): UploadIssue | undefined {
  if (!width || !height) return 'decode';
  if (width > MAX_IMAGE_EDGE || height > MAX_IMAGE_EDGE || width * height > MAX_IMAGE_PIXELS) return 'dimensions';
  return undefined;
}

export function qualityForPpi(ppi: number): 'suitable' | 'warning' | 'risk' {
  return ppi >= 300 ? 'suitable' : ppi >= 200 ? 'warning' : 'risk';
}

export const uploadIssueMessage: Record<UploadIssue, string> = {
  unsupported: 'Bu dosya türü desteklenmiyor. PNG, JPG, WebP veya HEIC yükleyebilirsin.',
  svg: 'SVG dosyaları yüklenemez. Hazır sembollerden birini kullanabilir veya görselini PNG/JPG olarak yükleyebilirsin.',
  gif: 'GIF dosyaları yüklenemez. PNG, JPG, WebP veya HEIC yükleyebilirsin.',
  size: 'Bu görsel 10 MB sınırını aşıyor. Daha küçük bir dosya seç.',
  dimensions: 'Bu görsel tarayıcıda güvenli işlemek için fazla büyük. Daha küçük boyutlu bir görsel dene.',
  decode: 'Görsel okunamadı. Dosyayı kontrol edip tekrar dene.',
};
