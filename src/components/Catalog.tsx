import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { colorHex, colorNames, products } from '../data/products';
import { formatTRY } from '../lib/pricing';
import type { Product } from '../types';
import { ShirtVisual } from './Artwork';

export function Catalog({ onCustomize, onProduct }: { onCustomize: () => void; onProduct: (product: Product) => void }) {
  return (
    <main className="catalog-page">
      <section className="editorial-hero">
        <div className="editorial-hero__copy">
          <span className="editorial-index">TEELAB / 2026 — İSTANBUL</span>
          <h1>Fikrini<br />giy.</h1>
          <p>Giyilebilir fikirler, sınırlı baskılar ve sana ait bir tasarım stüdyosu.</p>
          <div className="editorial-hero__actions">
            <button className="button button--ink" onClick={onCustomize}>Kendin Tasarla <ArrowRight size={17} /></button>
            <a href="#koleksiyon">Koleksiyonu gör <span>↓</span></a>
          </div>
          <div className="editorial-proof"><span><Check /> 220 gr pamuk</span><span><Check /> DTG baskı</span><span><Check /> Ön + arka tasarım</span></div>
        </div>
        <div className="editorial-hero__product">
          <ShirtVisual color="black" artwork="orbit" label="Gece Yörüngesi siyah tişört ön görünümü" />
          <div className="editorial-hero__meta"><span>SEÇKİ 01</span><b>Gece Yörüngesi</b><small>Sınırlı baskı / {formatTRY(products[0].price)}</small></div>
        </div>
      </section>

      <section className="editorial-collection" id="koleksiyon">
        <header className="editorial-section-heading">
          <div><span className="editorial-index">HAZIR KOLEKSİYON</span><h2>Dört fikir.<br />İki yüz.</h2></div>
          <p>Her parça ön ve arka yüzüyle birlikte düşünülür. Baskı dokusu, kumaş ve renk tek bir kompozisyonda buluşur.</p>
        </header>
        <div className="editorial-product-grid">
          {products.map((product, index) => (
            <article className="editorial-product" key={product.id}>
              <button className="editorial-product__visual" onClick={() => onProduct(product)} aria-label={`${product.name} ürününü incele`}>
                <span className="editorial-product__number">0{index + 1}</span>
                <div><ShirtVisual color={product.colors[0]} side="front" artwork={product.artwork} label={`${product.name} ön görünümü`} /><small>ÖN</small></div>
                <div><ShirtVisual color={product.colors[0]} side="back" artwork={product.artwork} label={`${product.name} arka görünümü`} /><small>ARKA</small></div>
              </button>
              <div className="editorial-product__info">
                <div><h3>{product.name}</h3><p>{product.description}</p></div>
                <strong>{formatTRY(product.price)}</strong>
              </div>
              <div className="editorial-product__footer">
                <div className="swatches" aria-label="Renk seçenekleri">{product.colors.map((color) => <span key={color} title={colorNames[color]} style={{ background: colorHex[color] }} />)}</div>
                <button onClick={() => onProduct(product)}>Ürünü incele <ArrowRight size={15} /></button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="editorial-studio-cta">
        <span className="editorial-index"><Sparkles size={13} /> TEELAB STÜDYO</span>
        <h2>Hazır olanı değil,<br />aklındakini giy.</h2>
        <p>Ürününü seç. Ön ve arka yüzü tasarla. Gerçek baskı ölçüleriyle önizle.</p>
        <button className="button button--paper" onClick={onCustomize}>Stüdyoyu aç <ArrowRight size={17} /></button>
      </section>
    </main>
  );
}
