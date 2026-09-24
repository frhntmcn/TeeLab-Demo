import geceYorungesi from '../assets/artworks/gece-yorungesi-print.webp';
import anadoluForm from '../assets/artworks/anadolu-form-print.webp';
import morSinyal from '../assets/artworks/mor-sinyal-print.webp';
import iyiFikir from '../assets/artworks/iyi-fikir-print.webp';
import type { Product, ShirtColor, ShirtFit, Side } from '../types';
import { Mockup } from './Mockup';

const artworkImages: Record<Product['artwork'], string> = {
  orbit: geceYorungesi,
  anatolia: anadoluForm,
  signal: morSinyal,
  typography: iyiFikir,
};

const artworkLabels: Record<Product['artwork'], string> = {
  orbit: 'Gece Yörüngesi yüksek çözünürlüklü baskı tasarımı',
  anatolia: 'Anadolu Form yüksek çözünürlüklü baskı tasarımı',
  signal: 'Mor Sinyal yüksek çözünürlüklü baskı tasarımı',
  typography: 'İyi Fikir yüksek çözünürlüklü baskı tasarımı',
};

export function Artwork({ type }: { type: Product['artwork'] }) {
  return <img className="art art-raster" src={artworkImages[type]} alt={artworkLabels[type]} decoding="async" />;
}

export function ShirtVisual({ color, fit, side = 'front', artwork, designUrl, label }: { color: ShirtColor; fit?: ShirtFit; side?: Side; artwork?: Product['artwork']; designUrl?: string; label?: string }) {
  return <Mockup color={color} fit={fit} side={side} designUrl={designUrl} designContent={artwork ? <Artwork type={artwork} /> : undefined} className="shirt-stage" label={label ?? 'Fotogerçekçi tişört önizlemesi'} />;
}
