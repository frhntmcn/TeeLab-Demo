import type { Product, ProductCategory, ShirtColor } from '../types';

export const categoryLabels: Record<ProductCategory, string> = {
  cosmic: 'Kozmik',
  anatolia: 'Anadolu',
  signal: 'Sinyal',
  typography: 'Tipografi',
};

export const products: Product[] = [
  { id: 'gece-yörüngesi', name: 'Gece Yörüngesi', description: 'Kozmik çizgiler, şehir geceleri için.', price: 649, category: 'cosmic', colors: ['black', 'white'], artwork: 'orbit' },
  { id: 'anadolu-form', name: 'Anadolu Form', description: 'Geleneksel ritim, çağdaş geometri.', price: 629, category: 'anatolia', colors: ['beige', 'white'], artwork: 'anatolia' },
  { id: 'mor-sinyal', name: 'Mor Sinyal', description: 'Dijital çağdan cesur bir frekans.', price: 679, category: 'signal', colors: ['white', 'black', 'purple'], artwork: 'signal' },
  { id: 'iyi-fikir', name: 'İyi Fikir', description: 'Fikrini taşı, sohbeti başlat.', price: 599, category: 'typography', colors: ['white', 'beige'], artwork: 'typography' },
];

export const colorNames: Record<ShirtColor, string> = {
  white: 'Beyaz', black: 'Siyah', beige: 'Bej', purple: 'Mor',
};

export const colorHex: Record<ShirtColor, string> = {
  white: '#f8fafc', black: '#171923', beige: '#d7c6ad', purple: '#6d3bd1',
};

export const emptyDesign = () => ({ version: '7.4.0', objects: [] });
