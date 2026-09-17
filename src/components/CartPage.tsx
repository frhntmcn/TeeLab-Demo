import { CheckCircle2, MessageCircle, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { brand } from '../config/brand';
import { colorNames } from '../data/products';
import { cartSubtotal, MAX_CART_QUANTITY } from '../lib/cart';
import { type CheckoutFormValues, validateCheckout } from '../lib/checkout';
import { saveDemoOrder } from '../lib/orderInbox';
import { cartLineTotal, formatTRY } from '../lib/pricing';
import type { CartItem } from '../types';
import { ShirtVisual } from './Artwork';

interface Props { items: CartItem[]; onUpdate: (id: string, quantity: number) => void; onComplete: () => void; onContinue: () => void; }
const emptyForm: CheckoutFormValues = { name: '', phone: '', email: '', address: '' };

export function CartPage({ items, onUpdate, onComplete, onContinue }: Props) {
  const [completed, setCompleted] = useState(false);
  const [values, setValues] = useState<CheckoutFormValues>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormValues, string>>>({});
  const [supportNotice, setSupportNotice] = useState('');
  const inputRefs = useRef<Partial<Record<keyof CheckoutFormValues, HTMLInputElement | HTMLTextAreaElement | null>>>({});
  const successRef = useRef<HTMLHeadingElement>(null);
  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const updateField = (field: keyof CheckoutFormValues, value: string) => { setValues((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: undefined })); };
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const nextErrors = validateCheckout(values); setErrors(nextErrors);
    const firstError = (Object.keys(nextErrors) as (keyof CheckoutFormValues)[])[0];
    if (firstError) { inputRefs.current[firstError]?.focus(); return; }
    saveDemoOrder(values, items); onComplete(); setCompleted(true); window.setTimeout(() => successRef.current?.focus(), 0);
  };

  if (completed) return <main className="checkout-success" aria-labelledby="checkout-success-title"><span><CheckCircle2 /></span><p className="eyebrow">DEMO SİPARİŞ</p><h1 id="checkout-success-title" ref={successRef} tabIndex={-1}>Demo talebin hazır.</h1><p>Bu bir demo akışıdır; ödeme alınmadı ve sipariş iletilmedi. Sepetindeki ürünler, demo tamamlanması sonrası açıkça temizlendi.</p><button className="button button--primary" onClick={() => { setCompleted(false); onContinue(); }}>Koleksiyona dön</button></main>;

  return <main className="cart-page">
    <header className="page-intro"><span className="eyebrow">SEPETİN</span><h1>Seçtiklerin, tek yerde.</h1><p>Ürünlerini kontrol et, teslimat bilgilerini gir ve demo sipariş akışını tamamla.</p></header>
    {!items.length ? <section className="empty-cart"><ShoppingBag /><h2>Sepetin henüz boş.</h2><p>Koleksiyondan bir tasarım seçebilir veya stüdyoda kendi fikrini oluşturabilirsin.</p><button className="button button--primary" onClick={onContinue}>Koleksiyonu keşfet</button></section> : <div className="cart-layout">
      <section className="cart-items" aria-label="Sepet ürünleri">{items.map((item) => <article className="cart-line" key={item.id}>
        <div className="cart-thumb">{item.designPreview ? <img src={item.designPreview} alt={`${item.name} tasarım önizlemesi`} /> : <ShirtVisual color={item.color} artwork={item.artwork} label={`${item.name} ön görünümü`} />}</div>
        <div className="cart-line-copy"><span className="eyebrow">{item.isCustom ? `${brand.name.toUpperCase()} STÜDYO` : `${brand.name.toUpperCase()} KOLEKSİYON`}</span><h2>{item.name}</h2><p>{colorNames[item.color]} · {item.size} beden · {item.fit === 'oversize' ? 'Oversize' : 'Slim fit'} · {item.isCustom ? 'Özel tasarım' : 'Hazır tasarım'}</p><strong>{formatTRY(cartLineTotal(item))}</strong>{item.quantity > 1 && <small>{formatTRY(item.unitPrice)} / adet</small>}</div>
        <div className="cart-quantity" aria-label={`${item.name} adedi`}><button onClick={() => onUpdate(item.id, item.quantity - 1)} aria-label={`${item.name} adedini azalt`}><Minus /></button><b aria-live="polite">{item.quantity}</b><button onClick={() => onUpdate(item.id, item.quantity + 1)} disabled={item.quantity >= MAX_CART_QUANTITY} aria-label={`${item.name} adedini artır`}><Plus /></button></div>
        <button className="cart-remove" onClick={() => onUpdate(item.id, 0)} aria-label={`${item.name} ürününü sepetten kaldır`}><Trash2 /></button>
      </article>)}</section>
      <aside className="checkout-card" aria-labelledby="checkout-title"><span className="eyebrow">TESLİMAT BİLGİLERİ</span><h2 id="checkout-title">Demo siparişini tamamla</h2><p className="checkout-demo-note">Ödeme alınmaz; gerçek sipariş veya dış sisteme mesaj gönderilmez.</p>
        <form noValidate onSubmit={submit}><div className="form-error-summary" role="alert" aria-live="assertive">{Object.keys(errors).length > 0 && 'Lütfen işaretli alanları düzelt.'}</div>
          <label htmlFor="checkout-name">Ad soyad<input id="checkout-name" ref={(node) => { inputRefs.current.name = node; }} value={values.name} onChange={(event) => updateField('name', event.target.value)} autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'checkout-name-error' : undefined} /></label>{errors.name && <p id="checkout-name-error" className="field-error">{errors.name}</p>}
          <div className="checkout-fields"><div><label htmlFor="checkout-phone">Telefon<input id="checkout-phone" ref={(node) => { inputRefs.current.phone = node; }} value={values.phone} onChange={(event) => updateField('phone', event.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="05__ ___ __ __" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'checkout-phone-error' : undefined} /></label>{errors.phone && <p id="checkout-phone-error" className="field-error">{errors.phone}</p>}</div><div><label htmlFor="checkout-email">E-posta<input id="checkout-email" ref={(node) => { inputRefs.current.email = node; }} value={values.email} onChange={(event) => updateField('email', event.target.value)} type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'checkout-email-error' : undefined} /></label>{errors.email && <p id="checkout-email-error" className="field-error">{errors.email}</p>}</div></div>
          <label htmlFor="checkout-address">Teslimat adresi<textarea id="checkout-address" ref={(node) => { inputRefs.current.address = node; }} value={values.address} onChange={(event) => updateField('address', event.target.value)} autoComplete="street-address" rows={3} aria-invalid={Boolean(errors.address)} aria-describedby={errors.address ? 'checkout-address-error' : undefined} /></label>{errors.address && <p id="checkout-address-error" className="field-error">{errors.address}</p>}
          <div className="checkout-total"><span>Toplam</span><strong>{formatTRY(subtotal)}</strong></div><small>Kargo bedeli demo akışında hesaplanmaz. Ödeme alınmayacaktır.</small><button className="button button--primary button--wide" type="submit">Demo siparişi tamamla</button>
        </form>
        <button className="whatsapp-button" type="button" onClick={() => setSupportNotice('WhatsApp desteği bu demo sürümünde simüle edilir; mesaj gönderilmedi.')}><MessageCircle /> Demo desteği hakkında bilgi</button>{supportNotice && <p className="support-notice" role="status">{supportNotice}</p>}
      </aside>
    </div>}
  </main>;
}
