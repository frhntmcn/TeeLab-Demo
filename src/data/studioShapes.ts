export const studioShapes = [
  { id: 'rectangle', name: 'Dikdörtgen' },
  { id: 'rounded-rectangle', name: 'Yuvarlak köşeli' },
  { id: 'circle', name: 'Daire' },
  { id: 'ellipse', name: 'Elips' },
  { id: 'triangle', name: 'Üçgen' },
  { id: 'star', name: 'Yıldız' },
  { id: 'diamond', name: 'Baklava' },
  { id: 'line', name: 'Çizgi' },
] as const;

export type StudioShapeId = (typeof studioShapes)[number]['id'];
