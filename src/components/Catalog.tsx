import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { colorHex, colorNames, products } from '../data/products';
import type { Product } from '../types';
import { ShirtVisual } from './Artwork';

export function Catalog({ onCustomize, onProduct }: { onCustomize: () => void; onProduct: (product: Product) => void }) {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={14} /> Türkiye'de tasarlandı, senin için basıldı.</span>
          <h1>Fikrini<br /><em>giy.</em></h1>
          <p>Hayalindeki tişörtü birkaç dakikada tasarla. Biz yüksek kaliteli dijital baskıyla gerçeğe dönüştürelim.</p>
          <div className="hero-actions">
            <button className="button button--primary" onClick={onCustomize}>Kendin Tasarla <ArrowRight size={18} /></button>
            <button className="button button--ghost" onClick={() => document.getElementById('koleksiyon')?.scrollIntoView({ behavior: 'smooth' })}>Koleksiyonu keşfet</button>
          </div>
          <div className="hero-trust"><span><Check size={15} /> Premium kumaş</span><span><Check size={15} /> Canlı baskı</span><span><Check size={15} /> Hızlı üretim</span></div>
        </div>
        <div className="hero-visual">
          <div className="hero-orb" />
          <div className="hero-shirt hero-shirt--back"><ShirtVisual color="beige" side="back" artwork="anatolia" /></div>
          <div className="hero-shirt hero-shirt--front"><ShirtVisual color="white" artwork="signal" /></div>
          <span className="floating-note note-one">30 × 40 cm<br /><b>baskı alanı</b></span>
          <span className="floating-note note-two">Sen tasarla.<br /><b>Biz basalım.</b></span>
        </div>
      </section>

      <section className="collection" id="koleksiyon">
        <div className="section-heading">
          <div><span className="eyebrow">TEELAB SEÇKİSİ</span><h2>Hazır fikirler, iyi tişörtler.</h2></div>
          <p>Stüdyomuzdan çıkan sınırlı tasarımları keşfet veya onları kendine göre yorumla.</p>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-image">
                <span className="product-tag">YENİ</span>
                <ShirtVisual color={product.colors[0]} side="front" artwork={product.artwork} label={`${product.name} ön görünümü`} />
                <div className="product-back-mini"><span>ARKA</span><ShirtVisual color={product.colors[0]} side="back" label={`${product.name} arka görünümü`} /></div>
              </div>
              <div className="product-info">
                <div><h3>{product.name}</h3><p>{product.description}</p></div>
                <strong>{product.price.toLocaleString('tr-TR')} ₺</strong>
              </div>
              <div className="product-footer">
                <div className="swatches" aria-label="Renk seçenekleri">{product.colors.map((color) => <span key={color} title={colorNames[color]} style={{ background: colorHex[color] }} />)}</div>
                <button onClick={() => onProduct(product)}>İncele <ArrowRight size={15} /></button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="studio-cta">
        <span>TEELAB STÜDYO</span><h2>Aklında bir şey mi var?</h2><p>Metin, sembol ya da kendi görselin. Baskı alanı senin oyun alanın.</p>
        <button className="button button--light" onClick={onCustomize}>Tasarlamaya başla <ArrowRight size={18} /></button>
      </section>
    </main>
  );
}
