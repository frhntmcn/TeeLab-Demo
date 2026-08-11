import type { Product, ProductCategory, ShirtColor } from '../types';

export const categoryLabels: Record<ProductCategory, string> = {
  cosmic: 'Kozmik',
  anatolia: 'Anadolu',
  signal: 'Sinyal',
  typography: 'Tipografi',
};

export const products: Product[] = [
  { id: 'gece-yörüngesi', name: 'Gece Yörüngesi', description: 'Kozmik çizgiler, şehir geceleri için.', price: 649, category: 'cosmic', colors: ['black', 'white'], sizes: ['S', 'M', 'L', 'XL'], stock: { black: { S: 5, M: 4, L: 2, XL: 0 }, white: { S: 3, M: 5, L: 2, XL: 1 } }, artwork: 'orbit' },
  { id: 'anadolu-form', name: 'Anadolu Form', description: 'Geleneksel ritim, çağdaş geometri.', price: 629, category: 'anatolia', colors: ['beige', 'white'], sizes: ['S', 'M', 'L', 'XL'], stock: { beige: { S: 2, M: 3, L: 0, XL: 1 }, white: { S: 4, M: 3, L: 2, XL: 0 } }, artwork: 'anatolia' },
  { id: 'mor-sinyal', name: 'Mor Sinyal', description: 'Dijital çağdan cesur bir frekans.', price: 679, category: 'signal', colors: ['white', 'black', 'purple'], sizes: ['S', 'M', 'L', 'XL'], stock: { white: { S: 4, M: 3, L: 2, XL: 1 }, black: { S: 0, M: 2, L: 2, XL: 1 }, purple: { S: 1, M: 0, L: 1, XL: 0 } }, artwork: 'signal' },
  { id: 'iyi-fikir', name: 'İyi Fikir', description: 'Fikrini taşı, sohbeti başlat.', price: 599, category: 'typography', colors: ['white', 'beige'], sizes: ['S', 'M', 'L', 'XL'], stock: { white: { S: 5, M: 5, L: 4, XL: 2 }, beige: { S: 2, M: 2, L: 1, XL: 0 } }, artwork: 'typography' },
];

export const colorNames: Record<ShirtColor, string> = {
  white: 'Beyaz', black: 'Siyah', beige: 'Bej', purple: 'Mor',
};

export const colorHex: Record<ShirtColor, string> = {
  white: '#f8fafc', black: '#171923', beige: '#d7c6ad', purple: '#6d3bd1',
};

export const emptyDesign = () => ({ version: '7.4.0', objects: [] });
