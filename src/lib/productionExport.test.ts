import { describe, expect, it } from 'vitest';
import { crc32, PRINT_DPI, PRINT_PIXEL_SIZE, PRINT_AREA_CM } from './productionExport';

describe('production PNG dimensions and metadata primitives', () => {
  it('computes a 300 DPI raster for the configured 30 by 40 cm print area', () => {
    expect(PRINT_DPI).toBe(300);
    expect(PRINT_PIXEL_SIZE).toEqual({ width: 3543, height: 4724 });
    expect(Math.round(PRINT_PIXEL_SIZE.width / PRINT_DPI * 2.54 * 10) / 10).toBe(PRINT_AREA_CM.width);
  });

  it('uses the standard PNG CRC-32 checksum', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
});
