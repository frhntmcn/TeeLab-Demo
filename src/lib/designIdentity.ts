import type { DesignSides, ShirtFit } from '../types';

function stableValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableValue(item)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** Deterministic, local-only identity for a pair of Fabric design documents. */
export function designHash(documents: DesignSides, fit: ShirtFit = 'slim'): string {
  const input = stableValue({ documents, fit });
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `d-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function cartMergeKey(item: Pick<import('../types').CartItem, 'productId' | 'color' | 'size' | 'designHash' | 'fit'>): string {
  return [item.productId, item.color, item.size, item.fit ?? 'slim', item.designHash].join('|');
}
