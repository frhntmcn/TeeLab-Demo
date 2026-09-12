import { ArrowLeft, CheckCircle2, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { colorHex, colorNames } from '../data/products';
import { formatTRY } from '../lib/pricing';
import type { CartItem, Product, ShirtColor, ShirtSize, Side } from '../types';
import { ShirtVisual } from './Artwork';

export function ProductDetail({ product, onBack, onCustomize, onAdd }: { product: Product; onBack: () => void; onCustomize: () => void; onAdd: (item: CartItem) => void }) {
  const [color, setColor] = useState<ShirtColor>(product.colors[0]);
  const [size, setSize] = useState<ShirtSize>('M');
  const [quantity, setQuantity] = useState(1);
  const [viewSide, setViewSide] = useState<Side>('front');
  const [added, setAdded] = useState(false);
  const add = () => {
    onAdd({ id: `${product.id}-${color}-${size}-${Date.now()}`, designHash: `catalog:${product.artwork}`, productId: product.id, name: product.name, color, size, quantity, unitPrice: product.price, artwork: product.artwork });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  };

  return (
    <main className="detail-page">
      <button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Koleksiyona dön</button>
      <div className="detail-layout">
        <div className="detail-visual">
          <span className="detail-badge">SINIRLI SERİ</span>
          <div className="detail-side-switch" role="tablist" aria-label="Tişört görünümü">
            <button className={viewSide === 'front' ? 'is-active' : ''} onClick={() => setViewSide('front')}>Ön</button>
            <button className={viewSide === 'back' ? 'is-active' : ''} onClick={() => setViewSide('back')}>Arka</button>
          </div>
          <ShirtVisual color={color} side={viewSide} artwork={product.artwork} label={`${product.name} ${viewSide === 'front' ? 'ön' : 'arka'} görünümü`} />
          <span className="detail-side-caption">{viewSide === 'front' ? 'ÖN GÖRÜNÜM' : 'ARKA GÖRÜNÜM'}</span>
        </div>
        <section className="detail-panel">
          <span className="eyebrow">TEELAB / KOLEKSİYON</span><h1>{product.name}</h1><p className="detail-lead">{product.description} 220 gr premium penye kumaş ve kalıcı DTG baskı.</p>
          <strong className="detail-price" aria-live="polite">{formatTRY(product.price * quantity)} <small>{quantity > 1 ? `${quantity} adet` : '1 adet'}</small></strong>
          <fieldset><legend>Renk — <b>{colorNames[color]}</b></legend><div className="option-row">{product.colors.map((item) => <button type="button" key={item} className={`color-option ${color === item ? 'is-active' : ''}`} onClick={() => setColor(item)} aria-label={`${colorNames[item]}${color === item ? ', seçili' : ''}`} aria-pressed={color === item} style={{ '--swatch': colorHex[item] } as React.CSSProperties} />)}</div></fieldset>
          <fieldset><legend>Beden — <b>{size}</b></legend><div className="option-row">{(['S','M','L','XL','XXL'] as ShirtSize[]).map((item) => <button type="button" key={item} className={`size-option ${size === item ? 'is-active' : ''}`} onClick={() => setSize(item)} aria-pressed={size === item}>{item}</button>)}</div></fieldset>
          <label className="quantity-field">Adet <span><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Adedi azalt">−</button><b>{quantity}</b><button onClick={() => setQuantity(Math.min(25, quantity + 1))} aria-label="Adedi artır">+</button></span></label>
          <button className="button button--primary button--wide" onClick={add}><ShoppingBag size={18} /> Sepete Ekle</button>
          {added && <div className="toast" role="status"><CheckCircle2 size={18} /> Demo sepetine eklendi. Sepetteki ürünlerini kontrol edebilirsin.</div>}
          <button className="customize-link" onClick={onCustomize}>Bu tasarımı kendine göre özelleştir <span>Studio’da ön ve arka yüzü düzenle →</span></button>
          <ul className="feature-list"><li><CheckCircle2 size={17} /> 220 gr premium pamuk</li><li><CheckCircle2 size={17} /> Su bazlı, canlı DTG baskı</li><li><CheckCircle2 size={17} /> 2–4 iş gününde üretim</li></ul>
          <details className="trust-details"><summary>Beden tablosu</summary><div className="size-table"><span>Beden</span><b>S</b><b>M</b><b>L</b><b>XL</b><span>Göğüs</span><em>50 cm</em><em>53 cm</em><em>56 cm</em><em>59 cm</em><span>Boy</span><em>68 cm</em><em>71 cm</em><em>74 cm</em><em>77 cm</em></div></details>
          <details className="trust-details"><summary>Kargo ve iade</summary><p>Demo politikası: 2–4 iş gününde üretim, ardından takipli gönderim. Kişiye özel baskılı ürünlerde üretim hatası dışındaki iadeler gerçek mağaza koşullarına göre değerlendirilir.</p></details>
        </section>
      </div>
    </main>
  );
}
