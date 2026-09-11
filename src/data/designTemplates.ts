import type { DesignDocument, DesignTemplate } from '../types';

const text = (text: string, top: number, fontSize: number, options: Record<string, unknown> = {}) => ({
  type: 'Textbox',
  text,
  left: 225,
  top,
  originX: 'center',
  originY: 'center',
  width: 330,
  fontFamily: 'Arial',
  fontSize,
  fontWeight: 700,
  fill: '#0f172a',
  textAlign: 'center',
  ...options,
});

const document = (...objects: Record<string, unknown>[]): DesignDocument => ({ version: '7.4.0', objects });

// These documents contain only Fabric text objects and app-owned typographic symbols.
// They intentionally contain no user-supplied SVG, URLs, or remote assets.
export const designTemplates: DesignTemplate[] = [
  { id: 'big-heading', name: 'Büyük Başlık', description: 'Tek, güçlü bir mesaj.', document: document(text('KENDİN OL', 290, 54)) },
  { id: 'two-line-message', name: 'İki Satır Mesaj', description: 'Kısa bir ana fikir ve alt satır.', document: document(text('BUGÜN', 250, 50), text('İZ BIRAK', 330, 42, { fontWeight: 400 })) },
  { id: 'center-symbol', name: 'Merkez Sembol', description: 'Ortada sade bir yıldız işareti.', document: document(text('✦', 270, 116, { fill: '#7c3aed' }), text('YENİ BİR FİKİR', 365, 20, { fontWeight: 400 })) },
  { id: 'badge-composition', name: 'Rozet Kompozisyonu', description: 'Katmanlı, yuvarlak rozet hissi.', document: document(text('CREATE', 250, 38, { fill: '#7c3aed' }), text('✦  EVERY DAY  ✦', 305, 18, { fontWeight: 400 }), text('2026', 350, 18, { fontWeight: 400 })) },
  { id: 'pocket-back-message', name: 'Ön Cep / Arka Mesaj', description: 'Aktif yüzde cep imzası başlangıcı.', document: document(text('TL', 190, 28, { left: 130, fill: '#7c3aed' }), text('MAKE SPACE', 330, 30)) },
  { id: 'typographic-poster', name: 'Tipografik Poster', description: 'Dikey ritimli tipografik düzen.', document: document(text('T', 200, 74, { fontFamily: 'Impact', fill: '#7c3aed' }), text('E', 275, 74, { fontFamily: 'Impact' }), text('E', 350, 74, { fontFamily: 'Impact', fill: '#7c3aed' })) },
];

export function cloneTemplateDocument(template: DesignTemplate): DesignDocument {
  return JSON.parse(JSON.stringify(template.document)) as DesignDocument;
}
