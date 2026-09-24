import { ArrowLeft, ArrowRight, Mail, Send } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { brand } from '../config/brand';

type InfoPageKind = 'about' | 'contact' | 'faq' | 'business';

const questions = [
  ['Kendi tasarımımı nasıl oluşturabilirim?', 'Stüdyo sayfasını açıp ön ve arka baskı yüzlerini düzenleyebilirsin. Taslak şu an yalnızca aynı tarayıcıda saklanır.'],
  ['Şu anda siteden ödeme yapabilir miyim?', 'Hayır. Canlı ödeme, kargo ve sipariş akışı test edilip doğrulanana kadar site gerçek sipariş kabul etmez.'],
  ['Ürünlerin kumaş ve baskı özellikleri nedir?', 'Ürün özellikleri tedarikçi ve üretim ekibinden doğrulanmış bilgilerle eklenecek; doğrulanmamış malzeme veya üretim vaadi vermiyoruz.'],
  ['Teslimat ve iade koşulları nedir?', 'Gerçek işletme koşulları ve hukuki metinler onaylanmadan süre veya iade taahhüdü verilmiyor. Satış açılmadan önce bu bilgiler yayınlanacak.'],
  ['Kurumsal veya toplu sipariş için nasıl teklif alabilirim?', 'Aşağıdaki form e-posta uygulamanı açar. Mesaj, e-posta uygulamasında sen göndermedikçe Maymoon’a iletilmez.'],
] as const;

export function InformationPage({ kind }: { kind: InfoPageKind }) {
  const [notice, setNotice] = useState('');
  const title = kind === 'about' ? 'Maymoon hakkında' : kind === 'contact' ? 'İletişim' : kind === 'faq' ? 'Sık sorulan sorular' : 'Kurumsal ve toplu sipariş';
  const submitQuote = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const sizeQuantities = ['S', 'M', 'L', 'XL', 'XXL'].map((size) => [size, Math.max(0, Number.parseInt(String(form.get(`size_${size}`) ?? '0'), 10) || 0)] as const);
    const totalQuantity = sizeQuantities.reduce((total, [, quantity]) => total + quantity, 0);
    if (!totalQuantity) { setNotice('Teklif isteği için en az bir beden adedi gir.'); return; }
    if (totalQuantity > 10000) { setNotice('Toplam talep 10.000 adedi aşamaz. Daha büyük talepler için doğrudan e-posta gönder.'); return; }
    const subject = encodeURIComponent(`Kurumsal sipariş talebi — ${String(form.get('organization') ?? '')}`);
    const body = encodeURIComponent([
      `Kurum / firma: ${form.get('organization')}`,
      `İlgili kişi: ${form.get('contact')}`,
      `E-posta: ${form.get('email')}`,
      `Telefon: ${form.get('phone')}`,
      `Toplam tahmini adet: ${totalQuantity}`,
      `Beden dağılımı: ${sizeQuantities.filter(([, quantity]) => quantity > 0).map(([size, quantity]) => `${size}: ${quantity}`).join(', ')}`,
      `Ürün / not: ${form.get('details')}`,
    ].join('\n'));
    window.location.href = `mailto:${brand.contactEmail}?subject=${subject}&body=${body}`;
    setNotice('E-posta uygulaman açılıyor. Teklif isteği, e-posta uygulamasında Gönder’e basana kadar iletilmez.');
  };

  return <main className="information-page"><header><Link className="back-link" to="/"><ArrowLeft size={17} /> Ana sayfaya dön</Link><p className="eyebrow">MAYMOON / BİLGİ</p><h1>{title}</h1>{kind === 'about' && <p>Maymoon, kişisel fikirleri giyilebilir tasarıma dönüştürmeye odaklanan bir tasarım stüdyosudur. Ürün, üretim ve teslimat bilgileri doğrulanmış verilerle paylaşılır.</p>}{kind === 'contact' && <p>Soruların için e-posta ile ulaşabilirsin. Bu sayfada doğrulanmamış telefon veya açık adres bilgisi yayınlamıyoruz.</p>}{kind === 'faq' && <p>Stüdyo, ürünler ve mevcut sipariş durumu hakkında kısa yanıtlar.</p>}{kind === 'business' && <p>Ekibin, mağazan veya etkinliğin için özel baskı düşünüyorsan ihtiyaçlarını ilet; adet, ürün, termin ve fiyat teklifi işletme tarafından teyit edilecektir.</p>}</header>
    {kind === 'about' && <section className="information-card"><h2>Fikrini giy.</h2><p>Maymoon’un stüdyosu ön ve arka tasarımı aynı akışta hazırlamaya yardımcı olur. Üretim ve satış koşulları kesinleşmeden kalite, kumaş, teslimat süresi veya müşteri sayısı iddiası sunmuyoruz.</p><Link to="/studio">Stüdyoyu keşfet <ArrowRight size={16} /></Link></section>}
    {kind === 'contact' && <section className="information-card"><h2>Bize e-posta gönder</h2><a className="information-email" href={`mailto:${brand.contactEmail}`}><Mail /> {brand.contactEmail}</a><p>E-posta bağlantısı cihazındaki posta uygulamasını açar; ileti sen Gönder’e basmadan gönderilmez.</p></section>}
    {kind === 'faq' && <section className="information-faq">{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>}
    {kind === 'business' && <section className="information-card"><h2>Teklif talebi</h2><p>Bu form e-posta uygulamasında bir taslak oluşturur; kayıt veya otomatik gönderim yapmaz.</p><form className="quote-form" onSubmit={submitQuote}><label>Firma / kurum adı<input name="organization" autoComplete="organization" required /></label><label>İlgili kişi<input name="contact" autoComplete="name" required /></label><div><label>E-posta<input name="email" type="email" autoComplete="email" required /></label><label>Telefon<input name="phone" type="tel" autoComplete="tel" /></label></div><fieldset className="quote-size-matrix"><legend>Tahmini beden adetleri (en az bir beden gerekli)</legend>{['S', 'M', 'L', 'XL', 'XXL'].map((size) => <label key={size}>{size}<input name={`size_${size}`} type="number" min="0" max="10000" defaultValue="0" inputMode="numeric" /></label>)}</fieldset><label>Ürün ve ihtiyaç notu<textarea name="details" rows={4} /></label><button className="button button--ink" type="submit"><Send size={17} /> E-posta taslağı oluştur</button>{notice && <p role="status">{notice}</p>}</form></section>}
  </main>;
}
