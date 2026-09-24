import { ArrowLeft, CheckCircle2, Ruler, ShoppingBag, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { brand } from '../config/brand';
import { colorHex, colorNames } from '../data/products';
import { formatTRY } from '../lib/pricing';
import { AVAILABLE_SHIRT_SIZES, clampOrderQuantity, MAX_ORDER_QUANTITY } from '../lib/orderOptions';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';
import type { CartItem, Product, ShirtColor, ShirtSize, Side } from '../types';
import { ShirtVisual } from './Artwork';

export function ProductDetail({ product, stock, onBack, onCustomize, onAdd }: { product: Product; stock: number; onBack: () => void; onCustomize: () => void; onAdd: (item: CartItem) => void }) {
  const [color, setColor] = useState<ShirtColor>(product.colors[0]);
  const [size, setSize] = useState<ShirtSize>('M');
  const [quantity, setQuantity] = useState(1);
  const [viewSide, setViewSide] = useState<Side>('front');
  const [added, setAdded] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const closeSizeGuide = useCallback(() => setSizeGuideOpen(false), []);
  const sizeGuideRef = useAccessibleDialog<HTMLElement>(sizeGuideOpen, closeSizeGuide);
  useEffect(() => {
    if (stock > 0) setQuantity((current) => Math.min(current, stock));
  }, [stock]);
  const add = () => {
    if (stock === 0) return;
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
          <span className="eyebrow">{brand.name.toUpperCase()} / KOLEKSİYON</span><h1>{product.name}</h1><p className="detail-lead">{product.description}</p>
          <strong className="detail-price" aria-live="polite">{stock === 0 ? 'Tükendi' : formatTRY(product.price * quantity)} <small>{stock === 0 ? 'Bu ürün şu anda siparişe kapalı' : quantity > 1 ? `${quantity} adet` : '1 adet'}</small></strong>
          <fieldset><legend>Renk — <b>{colorNames[color]}</b></legend><div className="option-row">{product.colors.map((item) => <button type="button" key={item} className={`color-option ${color === item ? 'is-active' : ''}`} onClick={() => setColor(item)} aria-label={`${colorNames[item]}${color === item ? ', seçili' : ''}`} aria-pressed={color === item} style={{ '--swatch': colorHex[item] } as React.CSSProperties} />)}</div></fieldset>
          <fieldset><legend>Beden — <b>{size}</b></legend><div className="option-row">{AVAILABLE_SHIRT_SIZES.map((item) => <button type="button" key={item} className={`size-option ${size === item ? 'is-active' : ''}`} onClick={() => setSize(item)} aria-pressed={size === item}>{item}</button>)}</div></fieldset>
          <label className="quantity-field">Adet <span><button disabled={stock === 0} onClick={() => setQuantity(clampOrderQuantity(quantity - 1))} aria-label="Adedi azalt">−</button><b>{quantity}</b><button disabled={stock === 0} onClick={() => setQuantity(Math.min(MAX_ORDER_QUANTITY, stock, quantity + 1))} aria-label="Adedi artır">+</button></span></label>
          <button className="button button--primary button--wide" disabled={stock === 0} onClick={add}><ShoppingBag size={18} /> {stock === 0 ? 'Ürün tükendi' : 'Sepete Ekle'}</button>
          {added && <div className="toast" role="status"><CheckCircle2 size={18} /> Demo sepetine eklendi. Sepetteki ürünlerini kontrol edebilirsin.</div>}
          <button className="customize-link" onClick={onCustomize}>Bu tasarımı kendine göre özelleştir <span>Studio’da ön ve arka yüzü düzenle →</span></button>
          <ul className="feature-list"><li><CheckCircle2 size={17} /> Tasarım stüdyosunda ön ve arka yüz düzenleme</li><li><CheckCircle2 size={17} /> Baskı alanı ve görsel kalite kontrolü</li><li><CheckCircle2 size={17} /> Renk ve beden seçimi</li></ul>
          <button className="size-guide-trigger" type="button" onClick={() => setSizeGuideOpen(true)}><Ruler size={17} /> Beden ölçülerini görüntüle</button>
          <details className="trust-details"><summary>Teslimat ve iade bilgisi</summary><p>Satış, kargo ve iade koşulları doğrulanıp satın alma akışı açıldığında burada ve ödeme öncesinde açıkça paylaşılacaktır. Şu anda canlı sipariş alınmamaktadır.</p></details>
        </section>
      </div>
      {sizeGuideOpen && <div className="size-guide-backdrop" role="presentation" onMouseDown={closeSizeGuide}><section ref={sizeGuideRef} className="size-guide-dialog" role="dialog" aria-modal="true" aria-labelledby="size-guide-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}><button type="button" aria-label="Beden tablosunu kapat" onClick={closeSizeGuide}><X /></button><p className="eyebrow">BEDEN DESTEĞİ</p><h2 id="size-guide-title">Beden ölçüleri</h2><p>Bu arayüzdeki ölçüler örnek tablodur; ürün tedarikçisinin güncel ölçüleriyle doğrulanmadan üretim/satış bilgisi olarak kabul edilmemelidir.</p><div className="size-table"><span>Beden</span>{AVAILABLE_SHIRT_SIZES.map((item) => <b key={item}>{item}</b>)}<span>Göğüs</span>{['50 cm', '53 cm', '56 cm', '59 cm', '—'].map((value) => <em key={value}>{value}</em>)}<span>Boy</span>{['68 cm', '71 cm', '74 cm', '77 cm', '—'].map((value) => <em key={value}>{value}</em>)}</div><small>XXL ölçüsü üretici verisi alındığında eklenecektir.</small></section></div>}
    </main>
  );
}
