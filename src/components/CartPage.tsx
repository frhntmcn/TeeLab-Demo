import { CheckCircle2, MessageCircle, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { colorNames } from '../data/products';
import { formatTRY } from '../lib/pricing';
import type { CartItem } from '../types';
import { ShirtVisual } from './Artwork';

interface Props {
  items: CartItem[];
  onUpdate: (id: string, quantity: number) => void;
  onContinue: () => void;
}

export function CartPage({ items, onUpdate, onContinue }: Props) {
  const [completed, setCompleted] = useState(false);
  const subtotal = useMemo(() => items.reduce((total, item) => total + item.unitPrice * item.quantity, 0), [items]);

  if (completed) {
    return (
      <main className="checkout-success">
        <span><CheckCircle2 /></span><p className="eyebrow">DEMO SİPARİŞ</p>
        <h1>Talebin hazır.</h1>
        <p>Bu bir demo akışıdır; ödeme alınmadı ve sipariş iletilmedi. Gerçek mağaza entegrasyonunda bu adım güvenli ödeme ve sipariş takibine bağlanır.</p>
        <button className="button button--primary" onClick={() => { setCompleted(false); onContinue(); }}>Koleksiyona dön</button>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <header className="page-intro"><span className="eyebrow">SEPETİN</span><h1>Seçtiklerin, tek yerde.</h1><p>Ürünlerini kontrol et, teslimat bilgilerini gir ve demo sipariş akışını tamamla.</p></header>
      {!items.length ? (
        <section className="empty-cart"><ShoppingBag /><h2>Sepetin henüz boş.</h2><p>Koleksiyondan bir tasarım seçebilir veya stüdyoda kendi fikrini oluşturabilirsin.</p><button className="button button--primary" onClick={onContinue}>Koleksiyonu keşfet</button></section>
      ) : (
        <div className="cart-layout">
          <section className="cart-items" aria-label="Sepet ürünleri">
            {items.map((item) => <article className="cart-line" key={item.id}>
              <div className="cart-thumb">{item.designPreview ? <img src={item.designPreview} alt={`${item.name} tasarım önizlemesi`} /> : <ShirtVisual color={item.color} artwork={item.artwork} label={`${item.name} ön görünümü`} />}</div>
              <div className="cart-line-copy"><span className="eyebrow">{item.isCustom ? 'TEELAB STÜDYO' : 'TEELAB KOLEKSİYON'}</span><h2>{item.name}</h2><p>{colorNames[item.color]} · {item.size} beden · {item.isCustom ? 'Özel tasarım' : 'Hazır tasarım'}</p><strong>{formatTRY(item.unitPrice)}</strong></div>
              <div className="cart-quantity" aria-label={`${item.name} adedi`}><button onClick={() => onUpdate(item.id, item.quantity - 1)} aria-label="Adedi azalt"><Minus /></button><b>{item.quantity}</b><button onClick={() => onUpdate(item.id, item.quantity + 1)} aria-label="Adedi artır"><Plus /></button></div>
              <button className="cart-remove" onClick={() => onUpdate(item.id, 0)} aria-label={`${item.name} ürününü sepetten kaldır`}><Trash2 /></button>
            </article>)}
          </section>
          <aside className="checkout-card">
            <span className="eyebrow">TESLİMAT BİLGİLERİ</span><h2>Siparişini tamamla</h2>
            <form onSubmit={(event) => { event.preventDefault(); setCompleted(true); }}>
              <label>Ad soyad<input required autoComplete="name" /></label>
              <div className="checkout-fields"><label>Telefon<input required type="tel" autoComplete="tel" placeholder="05__ ___ __ __" /></label><label>E-posta<input required type="email" autoComplete="email" /></label></div>
              <label>Teslimat adresi<textarea required autoComplete="street-address" rows={3} /></label>
              <div className="checkout-total"><span>Toplam</span><strong>{formatTRY(subtotal)}</strong></div>
              <small>Kargo bedeli demo akışında hesaplanmaz. Ödeme alınmayacaktır.</small>
              <button className="button button--primary button--wide" type="submit">Demo siparişi tamamla</button>
            </form>
            <button className="whatsapp-button" type="button" onClick={() => window.alert('WhatsApp destek bağlantısı demo sürümünde simüle edilmektedir.')}><MessageCircle /> WhatsApp’tan destek al</button>
          </aside>
        </div>
      )}
    </main>
  );
}
