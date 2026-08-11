import { describe, expect, it } from 'vitest';
import { exportSides, exportWarnings } from './export';

describe('PNG export helpers', () => {
  it('selects active and both sides without changing input state', () => { expect(exportSides('front')).toEqual(['front']); expect(exportSides('both')).toEqual(['front', 'back']); });
  it('warns for empty, low-quality and overflowing designs', () => {
    expect(exportWarnings([])).toEqual(['Boş tasarım PNG olarak indirilemez.']);
    expect(exportWarnings([{ id: 'x', side: 'front', kind: 'image', label: 'Raster', xCm: 29, yCm: 20, widthCm: 4, heightCm: 2, angle: 0, detail: '', vector: false, quality: 'risk' }])).toHaveLength(2);
  });
});
