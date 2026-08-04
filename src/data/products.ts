import type { Product, ShirtColor } from '../types';

export const products: Product[] = [
  { id: 'gece-yörüngesi', name: 'Gece Yörüngesi', description: 'Kozmik çizgiler, şehir geceleri için.', price: 649, colors: ['black', 'white'], artwork: 'orbit' },
  { id: 'anadolu-form', name: 'Anadolu Form', description: 'Geleneksel ritim, çağdaş geometri.', price: 629, colors: ['beige', 'white'], artwork: 'anatolia' },
  { id: 'mor-sinyal', name: 'Mor Sinyal', description: 'Dijital çağdan cesur bir frekans.', price: 679, colors: ['white', 'black', 'purple'], artwork: 'signal' },
  { id: 'iyi-fikir', name: 'İyi Fikir', description: 'Fikrini taşı, sohbeti başlat.', price: 599, colors: ['white', 'beige'], artwork: 'typography' },
];

export const colorNames: Record<ShirtColor, string> = {
  white: 'Beyaz', black: 'Siyah', beige: 'Bej', purple: 'Mor',
};

export const colorHex: Record<ShirtColor, string> = {
  white: '#f8fafc', black: '#171923', beige: '#d7c6ad', purple: '#6d3bd1',
};

export const emptyDesign = () => ({ version: '7.4.0', objects: [] });
