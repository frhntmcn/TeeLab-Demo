import type { DesignDocument } from '../types';

export interface EditorHistory {
  past: DesignDocument[];
  present: DesignDocument;
  future: DesignDocument[];
}

export interface ObjectRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const clone = (document: DesignDocument): DesignDocument => JSON.parse(JSON.stringify(document)) as DesignDocument;
const sameDocument = (left: DesignDocument, right: DesignDocument) => JSON.stringify(left) === JSON.stringify(right);

export function createHistory(document: DesignDocument): EditorHistory {
  return { past: [], present: clone(document), future: [] };
}

export function writeHistory(history: EditorHistory, document: DesignDocument): EditorHistory {
  if (sameDocument(history.present, document)) return history;
  return { past: [...history.past, clone(history.present)], present: clone(document), future: [] };
}

export function undoHistory(history: EditorHistory): { history: EditorHistory; document?: DesignDocument } {
  const previous = history.past.at(-1);
  if (!previous) return { history };
  return { history: { past: history.past.slice(0, -1), present: clone(previous), future: [clone(history.present), ...history.future] }, document: clone(previous) };
}

export function redoHistory(history: EditorHistory): { history: EditorHistory; document?: DesignDocument } {
  const next = history.future[0];
  if (!next) return { history };
  return { history: { past: [...history.past, clone(history.present)], present: clone(next), future: history.future.slice(1) }, document: clone(next) };
}

export function alignObjectCenter(rect: ObjectRect, axis: 'horizontal' | 'vertical', canvasWidth = 360, canvasHeight = 480) {
  const left = axis === 'horizontal' ? (canvasWidth - rect.width) / 2 : rect.left;
  const top = axis === 'vertical' ? (canvasHeight - rect.height) / 2 : rect.top;
  return {
    left: Math.max(0, Math.min(canvasWidth - rect.width, left)),
    top: Math.max(0, Math.min(canvasHeight - rect.height, top)),
  };
}
