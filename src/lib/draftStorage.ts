import { emptyDesign } from '../data/products';
import type { SavedDraft } from '../types';

const STORAGE_KEY = 'teelab.demo.draft.v1';

export const createEmptyDraft = (): SavedDraft => ({
  schemaVersion: 1,
  documents: { front: emptyDesign(), back: emptyDesign() },
  options: { color: 'white', size: 'M', quantity: 1 },
  activeSide: 'front',
  previews: { front: '', back: '' },
  updatedAt: new Date().toISOString(),
});

export function loadDraft(): SavedDraft {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyDraft();
    const value = JSON.parse(raw) as Partial<SavedDraft>;
    if (value.schemaVersion !== 1 || !value.documents?.front || !value.documents?.back || !value.options) return createEmptyDraft();
    return { ...createEmptyDraft(), ...value } as SavedDraft;
  } catch {
    return createEmptyDraft();
  }
}

export function saveDraft(draft: SavedDraft): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(): void {
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* storage is optional */ }
}
