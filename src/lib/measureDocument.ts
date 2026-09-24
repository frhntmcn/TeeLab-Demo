import { util } from 'fabric';
import type { DesignDocument, ObjectMeasurement, Side } from '../types';
import { constrainObject, getMeasurement, type MetaObject } from './measurements';

export async function measureDocument(
  document: DesignDocument,
  side: Side,
  deps: { enliven: typeof util.enlivenObjects } = { enliven: util.enlivenObjects },
): Promise<ObjectMeasurement[]> {
  if (!document || !Array.isArray(document.objects)) return [];
  try {
    const objects = await deps.enliven(document.objects);
    return objects.filter((object) => (object as MetaObject).visible !== false).map((object) => {
      const measured = object as MetaObject;
      constrainObject(measured);
      return getMeasurement(measured, side);
    });
  } catch {
    return [];
  }
}
