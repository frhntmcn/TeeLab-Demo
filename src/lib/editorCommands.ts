import type { DesignDocument, TemplateMetadata } from '../types';

export interface EditorSnapshot {
  document: DesignDocument;
  template?: TemplateMetadata;
}

export interface EditorHistory {
  past: EditorSnapshot[];
  present: EditorSnapshot;
  future: EditorSnapshot[];
}

export interface ObjectRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const clone = <T>(value: T): T => value === undefined ? value : JSON.parse(JSON.stringify(value)) as T;
const sameSnapshot = (left: EditorSnapshot, right: EditorSnapshot) => JSON.stringify(left) === JSON.stringify(right);

export function createHistory(document: DesignDocument, template?: TemplateMetadata): EditorHistory {
  return { past: [], present: clone({ document, template }), future: [] };
}

export function writeHistory(history: EditorHistory, document: DesignDocument, template?: TemplateMetadata): EditorHistory {
  const next = { document, template };
  if (sameSnapshot(history.present, next)) return history;
  return { past: [...history.past, clone(history.present)], present: clone(next), future: [] };
}

export function undoHistory(history: EditorHistory): { history: EditorHistory; document?: DesignDocument; template?: TemplateMetadata } {
  const previous = history.past.at(-1);
  if (!previous) return { history };
  return { history: { past: history.past.slice(0, -1), present: clone(previous), future: [clone(history.present), ...history.future] }, document: clone(previous.document), template: clone(previous.template) };
}

export function redoHistory(history: EditorHistory): { history: EditorHistory; document?: DesignDocument; template?: TemplateMetadata } {
  const next = history.future[0];
  if (!next) return { history };
  return { history: { past: [...history.past, clone(history.present)], present: clone(next), future: history.future.slice(1) }, document: clone(next.document), template: clone(next.template) };
}

export function alignObjectCenter(rect: ObjectRect, axis: 'horizontal' | 'vertical', canvasWidth = 360, canvasHeight = 480) {
  const left = axis === 'horizontal' ? (canvasWidth - rect.width) / 2 : rect.left;
  const top = axis === 'vertical' ? (canvasHeight - rect.height) / 2 : rect.top;
  return {
    left: Math.max(0, Math.min(canvasWidth - rect.width, left)),
    top: Math.max(0, Math.min(canvasHeight - rect.height, top)),
  };
}
