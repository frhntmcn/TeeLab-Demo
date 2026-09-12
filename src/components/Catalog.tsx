import { ArrowLeft, ArrowRight, Check, Pause, Play, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { colorHex, colorNames, products } from '../data/products';
import { formatTRY } from '../lib/pricing';
import type { Product } from '../types';
import { ShirtVisual } from './Artwork';

export function Catalog({ onCustomize, onProduct }: { onCustomize: () => void; onProduct: (product: Product) => void }) {
  const banners = [
    { title: <>Fikrini<br />giy.</>, copy: 'Kendi tasarımını ön ve arka yüzüyle oluştur.', color: 'black' as const, artwork: 'orbit' as const, name: 'Gece Yörüngesi', meta: 'Ön ve arka yüzüyle tasarlanmış TeeLab koleksiyon görünümü.', label: 'Siyah tişört üzerinde Gece Yörüngesi tasarımı.' },
    { title: <>Önü de senin,<br />arkası da.</>, copy: 'Her yüzü ayrı tasarla, tişörtünü tamamen kendine ait yap.', color: 'beige' as const, artwork: 'anatolia' as const, name: 'Anadolu Form', meta: 'TeeLab koleksiyonundaki ön ve arka baskı görünümü.', label: 'Bej tişört üzerinde Anadolu Form tasarımı.' },
    { title: <>Tasarla.<br />Önizle. Giy.</>, copy: 'Baskı alanını ve görsel kalitesini kontrol ederek ilerle.', color: 'white' as const, artwork: 'typography' as const, name: 'İyi Fikir', meta: 'TeeLab Stüdyo için üretim öncesi baskı yerleşimi örneği.', label: 'Beyaz tişört üzerinde İyi Fikir tasarımı.' },
  ];
  const [activeBanner, setActiveBanner] = useState(0);
  const [isPlaying, setIsPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const respectMotionPreference = () => { if (media.matches) setIsPlaying(false); };
    media.addEventListener('change', respectMotionPreference);
    return () => media.removeEventListener('change', respectMotionPreference);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => setActiveBanner((current) => (current + 1) % banners.length), 6500);
    return () => window.clearInterval(timer);
  }, [isPlaying, banners.length]);

  const banner = banners[activeBanner];
  const chooseBanner = (index: number) => { setActiveBanner(index); setIsPlaying(false); };

  return (
    <main className="catalog-page">
      <section className="home-hero" aria-roledescription="carousel" aria-label="TeeLab tanıtımı">
        <div className="home-hero__copy">
          <span className="editorial-index">TEELAB / 2026 — İSTANBUL</span>
          <p className="hero-slide-status" aria-live="polite">{activeBanner + 1} / {banners.length} · {banner.name}</p>
          <h1>{banner.title}</h1>
          <p>{banner.copy}</p>
          <div className="home-hero__actions">
            <button className="button button--ink" onClick={onCustomize}>Kendin Tasarla <ArrowRight size={17} /></button>
            <a href="#koleksiyon">Koleksiyonu İncele <span>↓</span></a>
          </div>
          <div className="hero-controls" aria-label="Hero içerik kontrolleri">
            <button type="button" aria-label="Önceki banner" onClick={() => chooseBanner((activeBanner + banners.length - 1) % banners.length)}><ArrowLeft size={16} /></button>
            <div className="hero-dots">{banners.map((item, index) => <button key={index} type="button" aria-label={`${index + 1}. banner: ${item.copy}`} aria-current={index === activeBanner ? 'true' : undefined} className={index === activeBanner ? 'is-active' : ''} onClick={() => chooseBanner(index)}><span /></button>)}</div>
            <button type="button" aria-label={isPlaying ? 'Otomatik geçişi durdur' : 'Otomatik geçişi başlat'} aria-pressed={!isPlaying} onClick={() => setIsPlaying((playing) => !playing)}>{isPlaying ? <Pause size={15} /> : <Play size={15} />}</button>
            <button type="button" aria-label="Sonraki banner" onClick={() => chooseBanner((activeBanner + 1) % banners.length)}><ArrowRight size={16} /></button>
          </div>
        </div>
        <div className="home-hero__visual" key={activeBanner}>
          <ShirtVisual color={banner.color} artwork={banner.artwork} label={banner.label} />
          <div className="home-hero__meta"><span>TEELAB KOLEKSİYON</span><b>{banner.name}</b><small>{banner.meta}</small></div>
        </div>
      </section>

      <section className="how-it-works" aria-labelledby="how-it-works-title">
        <header><span className="editorial-index">NASIL ÇALIŞIR</span><h2 id="how-it-works-title">Fikrinden tişörtüne.</h2></header>
        <ol>{[
          ['01', 'Ürünü seç', 'Koleksiyondan başla ya da Stüdyo’da tuvalini seç.'],
          ['02', 'Tasarla', 'Ön ve arka yüzü kendi fikrine göre düzenle.'],
          ['03', 'Önizle', 'Baskı alanını ve kalite bilgisini gözden geçir.'],
          ['04', 'Sepete ekle', 'Taslağını sakla, hazır olduğunda sepete ekle.'],
        ].map(([number, title, copy]) => <li key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></li>)}</ol>
      </section>

      <section className="trust-strip" aria-label="TeeLab özellikleri">
        <span><Check /> Ön / arka baskı</span><span><Check /> 30 × 40 cm baskı alanı</span><span><Check /> 300 PPI kalite kontrolü</span><span><Check /> Taslağını kaydet</span>
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
                <button onClick={() => onProduct(product)}>Ürünü İncele <ArrowRight size={15} /></button>
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
