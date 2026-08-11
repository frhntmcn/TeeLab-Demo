import { ArrowLeft, CheckCircle2, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { colorHex, colorNames } from '../data/products';
import { formatTRY } from '../lib/pricing';
import { colorHasStock, firstAvailableSize, getVariantStock } from '../lib/stock';
import type { CartItem, Product, ShirtColor, ShirtSize, Side } from '../types';
import { ShirtVisual } from './Artwork';

export function ProductDetail({ product, onBack, onCustomize, onAdd }: { product: Product; onBack: () => void; onCustomize: () => void; onAdd: (item: CartItem) => void }) {
  const [color, setColor] = useState<ShirtColor>(product.colors[0]);
  const [size, setSize] = useState<ShirtSize>(() => firstAvailableSize(product, product.colors[0]));
  const [quantity, setQuantity] = useState(1);
  const [viewSide, setViewSide] = useState<Side>('front');
  const [added, setAdded] = useState(false);
  const stock = getVariantStock(product, color, size);
  const isSoldOut = stock === 0;
  const selectColor = (nextColor: ShirtColor) => {
    setColor(nextColor);
    if (getVariantStock(product, nextColor, size) === 0) setSize(firstAvailableSize(product, nextColor));
    setQuantity(1);
  };
  const add = () => {
    onAdd({ id: `${product.id}-${color}-${size}-${Date.now()}`, designHash: `catalog:${product.artwork}`, productId: product.id, name: product.name, color, size, quantity, unitPrice: product.price, artwork: product.artwork });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  };

  return (
    <main className="detail-page">
      <button className="back-link" type="button" onClick={onBack}><ArrowLeft size={17} /> Koleksiyona dön</button>
      <div className="detail-layout">
        <div className="detail-visual">
          <span className="detail-badge">SINIRLI SERİ</span>
          <div className="detail-side-switch" role="group" aria-label="Tişört görünümü">
            <button type="button" className={viewSide === 'front' ? 'is-active' : ''} aria-pressed={viewSide === 'front'} onClick={() => setViewSide('front')}>Ön</button>
            <button type="button" className={viewSide === 'back' ? 'is-active' : ''} aria-pressed={viewSide === 'back'} onClick={() => setViewSide('back')}>Arka</button>
          </div>
          <ShirtVisual color={color} side={viewSide} artwork={product.artwork} label={`${product.name} ${viewSide === 'front' ? 'ön' : 'arka'} görünümü`} />
          <span className="detail-side-caption">{viewSide === 'front' ? 'ÖN GÖRÜNÜM' : 'ARKA GÖRÜNÜM'}</span>
        </div>
        <section className="detail-panel">
          <span className="eyebrow">TEELAB / KOLEKSİYON</span><h1>{product.name}</h1><p className="detail-lead">{product.description} 220 gr premium penye kumaş ve kalıcı DTG baskı.</p>
          <strong className="detail-price">{formatTRY(product.price * quantity)}</strong>
          <fieldset><legend>Renk — <b>{colorNames[color]}</b></legend><div className="option-row">{product.colors.map((item) => <button key={item} type="button" disabled={!colorHasStock(product, item)} className={`color-option ${color === item ? 'is-active' : ''}`} aria-label={colorNames[item]} aria-pressed={color === item} onClick={() => selectColor(item)} style={{ '--swatch': colorHex[item] } as React.CSSProperties} />)}</div></fieldset>
          <fieldset><legend>Beden</legend><div className="option-row">{product.sizes.map((item) => { const unavailable = getVariantStock(product, color, item) === 0; return <button key={item} type="button" disabled={unavailable} className={`size-option ${size === item ? 'is-active' : ''}`} aria-label={unavailable ? `${item} beden tükendi` : `${item} beden`} aria-pressed={size === item} onClick={() => { setSize(item); setQuantity(1); }}>{unavailable ? `${item} · Tükendi` : item}</button>; })}</div></fieldset>
          <div className="quantity-field" role="group" aria-label="Ürün adedi"><span>Adet</span><div><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Adedi azalt">−</button><b aria-live="polite" aria-atomic="true">{quantity}</b><button type="button" disabled={isSoldOut || quantity >= stock} onClick={() => setQuantity(quantity + 1)} aria-label="Adedi artır">+</button></div></div>
          <p className={`stock-status ${isSoldOut ? 'is-sold-out' : ''}`} role="status">{isSoldOut ? 'Tükendi' : `Stokta ${stock} adet kaldı`}</p>
          <button className="button button--primary button--wide" type="button" disabled={isSoldOut} onClick={add}><ShoppingBag size={18} /> {isSoldOut ? 'Tükendi' : 'Sepete Ekle'}</button>
          {added && <div className="toast" role="status"><CheckCircle2 size={18} /> Demo sepetine eklendi.</div>}
          <button className="customize-link" type="button" onClick={onCustomize}>Bu tasarımı kendine göre özelleştir →</button>
          <ul className="feature-list"><li><CheckCircle2 size={17} /> 220 gr premium pamuk</li><li><CheckCircle2 size={17} /> Su bazlı, canlı DTG baskı</li><li><CheckCircle2 size={17} /> 2–4 iş gününde üretim</li></ul>
          <details className="trust-details"><summary>Beden tablosu</summary><div className="size-table"><span>Beden</span><b>S</b><b>M</b><b>L</b><b>XL</b><span>Göğüs</span><em>50 cm</em><em>53 cm</em><em>56 cm</em><em>59 cm</em><span>Boy</span><em>68 cm</em><em>71 cm</em><em>74 cm</em><em>77 cm</em></div></details>
          <details className="trust-details"><summary>Kargo ve iade</summary><p>Demo politikası: 2–4 iş gününde üretim, ardından takipli gönderim. Kişiye özel baskılı ürünlerde üretim hatası dışındaki iadeler gerçek mağaza koşullarına göre değerlendirilir.</p></details>
        </section>
      </div>
    </main>
  );
}
