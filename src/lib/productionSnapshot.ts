import type { DesignSides, ObjectMeasurement, ProductionSnapshot, Side, TemplateMetadata } from '../types';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createProductionSnapshot(
  documents: DesignSides,
  measurements: Record<Side, ObjectMeasurement[]>,
  templateMetadata: Partial<Record<Side, TemplateMetadata>>,
  lockedAt = new Date().toISOString(),
): ProductionSnapshot {
  return {
    schemaVersion: 1,
    lockedAt,
    documents: clone(documents),
    measurements: clone(measurements),
    templateMetadata: clone(templateMetadata),
  };
}
