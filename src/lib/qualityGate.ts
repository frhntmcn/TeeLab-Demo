import type { ObjectMeasurement } from '../types';
export function hasOverflow(items: ObjectMeasurement[]) { return items.some((item) => item.xCm - item.widthCm / 2 < 0 || item.yCm - item.heightCm / 2 < 0 || item.xCm + item.widthCm / 2 > 30 || item.yCm + item.heightCm / 2 > 40); }
export function canContinue(items: ObjectMeasurement[]) { return !hasOverflow(items) && !items.some((item) => !item.vector && item.quality === 'risk'); }
