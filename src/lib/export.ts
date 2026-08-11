import type { ObjectMeasurement, Side } from '../types';

export function exportSides(target: Side | 'both'): Side[] { return target === 'both' ? ['front', 'back'] : [target]; }

export function exportWarnings(items: ObjectMeasurement[]): string[] {
  const warnings: string[] = [];
  if (!items.length) warnings.push('Boş tasarım PNG olarak indirilemez.');
  if (items.some((item) => item.quality === 'risk')) warnings.push('Düşük PPI: baskı kalitesi riski taşıyan görsel var.');
  if (items.some((item) => item.xCm - item.widthCm / 2 < 0 || item.yCm - item.heightCm / 2 < 0 || item.xCm + item.widthCm / 2 > 30 || item.yCm + item.heightCm / 2 > 40)) warnings.push('Baskı alanı taşması algılandı.');
  return warnings;
}
