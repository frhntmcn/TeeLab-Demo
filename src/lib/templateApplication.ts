import type { DesignDocument, DesignSides, Side } from '../types';

export function applyTemplateToActiveSide(documents: DesignSides, side: Side, template: DesignDocument): DesignSides {
  return { ...documents, [side]: template };
}

export function sideHasDesignContent(document: DesignDocument): boolean {
  return document.objects.length > 0;
}
