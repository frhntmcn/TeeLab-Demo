import { KeyRound, LogIn, Save, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCustomerOrders, getCustomerProfile, getCustomerSession, loginCustomer, logoutCustomer, registerCustomer, requestPasswordReset, requiresLiveCustomerAccount, updateCustomerProfile, type CustomerOrder, type CustomerProfile, type CustomerSession } from '../lib/customerSession';
import { deleteSavedStudioDesign, getSavedStudioDesigns, type SavedStudioDesign } from '../lib/customerDesigns';
import { formatTRY } from '../lib/pricing';

const emptyProfile: CustomerProfile = { name: '', email: '', phone: '', address: { first_name: '', last_name: '', company: '', tax_office: '', tax_number: '', line_1: '', line_2: '', city: '', district: '', postcode: '', country: 'TR' } };

export function AccountPage() {
  const liveHost = requiresLiveCustomerAccount();
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[] | null>(null);
  const [savedDesigns, setSavedDesigns] = useState<SavedStudioDesign[] | null>(null);
  const [designError, setDesignError] = useState('');
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!liveHost) return;
    getCustomerSession().then(setSession).catch(() => setSession({ authenticated: false }));
  }, [liveHost]);

  useEffect(() => {
    if (!session?.authenticated) return;
    getCustomerProfile().then(setProfile).catch(() => setProfile(emptyProfile));
    getCustomerOrders().then(({ orders: nextOrders }) => setOrders(nextOrders)).catch(() => setOrders([]));
  }, [session?.authenticated]);

  useEffect(() => {
    if (!session?.authenticated) return;
    getSavedStudioDesigns().then(({ designs }) => setSavedDesigns(designs)).catch((reason: unknown) => {
      setDesignError(reason instanceof Error ? reason.message : 'Tasarımlar alınamadı.');
      setSavedDesigns([]);
    });
  }, [session?.authenticated]);

  if (!liveHost) return <main className="account-page"><section className="account-card"><p className="eyebrow">PREVIEW MODU</p><h1>Hesap altyapısı canlı alan adında test edilecek.</h1><p>Vercel önizlemesinde müşteri hesapları oluşturulmaz; canlı WooCommerce bağlantısı etkinleştiğinde burada kayıt ve giriş kullanılabilir.</p></section></main>;
  if (!session) return <main className="account-page"><section className="account-card"><p>Hesap oturumu kontrol ediliyor…</p></section></main>;
  if (session.authenticated && session.user) return <main className="account-page"><section className="account-card account-card--wide">
    <p className="eyebrow">HESABIM</p><h1>Merhaba, {session.user.name}.</h1><p>{session.user.email} hesabıyla giriş yaptın. Bilgilerini güncelleyebilir, siparişlerini buradan takip edebilirsin.</p>
    {profile ? <form className="account-profile" onSubmit={(event) => { event.preventDefault(); setSubmitting(true); updateCustomerProfile(profile).then((next) => { setProfile(next); setNotice('Hesap bilgilerin kaydedildi.'); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Bilgiler kaydedilemedi.')).finally(() => setSubmitting(false)); }}><h2>İletişim ve fatura bilgileri</h2><div className="account-grid"><label>Ad soyad<input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} required /></label><label>Telefon<input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} inputMode="tel" /></label><label>Şirket adı (varsa)<input value={profile.address.company} onChange={(event) => setProfile({ ...profile, address: { ...profile.address, company: event.target.value } })} /></label><label>Vergi dairesi (varsa)<input value={profile.address.tax_office} onChange={(event) => setProfile({ ...profile, address: { ...profile.address, tax_office: event.target.value } })} /></label><label>Vergi numarası / TCKN<input value={profile.address.tax_number} onChange={(event) => setProfile({ ...profile, address: { ...profile.address, tax_number: event.target.value } })} /></label><label>İl<input value={profile.address.city} onChange={(event) => setProfile({ ...profile, address: { ...profile.address, city: event.target.value } })} /></label><label>İlçe<input value={profile.address.district} onChange={(event) => setProfile({ ...profile, address: { ...profile.address, district: event.target.value } })} /></label><label>Posta kodu<input value={profile.address.postcode} onChange={(event) => setProfile({ ...profile, address: { ...profile.address, postcode: event.target.value } })} /></label><label className="account-grid__wide">Adres<input value={profile.address.line_1} onChange={(event) => setProfile({ ...profile, address: { ...profile.address, line_1: event.target.value } })} /></label></div>{error && <p className="account-message account-message--error" role="alert">{error}</p>}{notice && <p className="account-message" role="status">{notice}</p>}<button className="button button--primary" disabled={submitting} type="submit"><Save size={18} />{submitting ? 'Kaydediliyor…' : 'Bilgilerimi kaydet'}</button></form> : <p>Profil hazırlanıyor…</p>}
    <section className="account-orders"><h2>Siparişlerim</h2>{orders === null ? <p>Siparişlerin yükleniyor…</p> : orders.length ? <ul>{orders.map((order) => <li key={order.id}><div><strong>#{order.number}</strong><span>{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(order.date))} · {order.items.map((item) => `${item.name} (${item.quantity})`).join(', ')}</span></div><b>{formatTRY(order.total)}</b><small>{order.status}</small></li>)}</ul> : <p>Henüz gerçek bir siparişin yok.</p>}</section>
    <section className="account-designs"><h2>Kayıtlı tasarımlarım</h2>{designError && <p className="account-message account-message--error" role="alert">{designError}</p>}{savedDesigns === null ? <p>Tasarımların yükleniyor…</p> : savedDesigns.length ? <ul>{savedDesigns.map((design) => <li key={design.id}><div><strong>{design.name}</strong><span>{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(design.updated_at))}</span></div><Link className="button button--ghost" to={`/studio?design=${encodeURIComponent(design.id)}`}>Düzenle</Link><button className="account-design-delete" type="button" onClick={() => { deleteSavedStudioDesign(design.id).then(() => setSavedDesigns((current) => current?.filter((item) => item.id !== design.id) ?? [] )).catch((reason: unknown) => setDesignError(reason instanceof Error ? reason.message : 'Tasarım silinemedi.')); }}>Sil</button></li>)}</ul> : <p>Henüz hesabına tasarım kaydetmedin. Studio’da tasarım hazırlayıp hesabına ekleyebilirsin.</p>}</section>
    <button className="account-logout" type="button" onClick={() => { logoutCustomer().then(setSession).catch(() => setSession({ authenticated: false })); }}>Çıkış yap</button>
  </section></main>;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(''); setNotice(''); setSubmitting(true);
    try {
      if (mode === 'register') setSession(await registerCustomer({ name, email, password }));
      else if (mode === 'login') setSession(await loginCustomer(email, password));
      else { await requestPasswordReset(email); setNotice('E-posta adresin kayıtlıysa şifre sıfırlama bağlantısı gönderilecek.'); }
      setPassword('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Hesap işlemi tamamlanamadı.');
    } finally { setSubmitting(false); }
  };

  const title = mode === 'login' ? 'Hesabına giriş yap' : mode === 'register' ? 'Maymoon hesabını oluştur' : 'Şifreni yenile';
  return <main className="account-page"><section className="account-card"><p className="eyebrow">MAYMOON HESABI</p><h1>{title}</h1><p>Satın alma işlemini tamamlamak için müşteri hesabı gereklidir.</p><form onSubmit={submit}>{mode === 'register' && <label>Ad soyad<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></label>}<label>E-posta<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete={mode === 'login' ? 'username' : 'email'} required /></label>{mode !== 'reset' && <label>Şifre<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 10 : undefined} required /></label>}{error && <p className="account-message account-message--error" role="alert">{error}</p>}{notice && <p className="account-message" role="status">{notice}</p>}<button className="button button--primary button--wide" disabled={submitting} type="submit">{mode === 'register' ? <UserPlus size={18} /> : mode === 'reset' ? <KeyRound size={18} /> : <LogIn size={18} />}{submitting ? 'İşleniyor…' : mode === 'register' ? 'Hesap oluştur' : mode === 'reset' ? 'Sıfırlama bağlantısı iste' : 'Giriş yap'}</button></form><div className="account-switches">{mode !== 'login' && <button type="button" onClick={() => setMode('login')}>Giriş yap</button>}{mode !== 'register' && <button type="button" onClick={() => setMode('register')}>Hesap oluştur</button>}{mode !== 'reset' && <button type="button" onClick={() => setMode('reset')}>Şifremi unuttum</button>}</div></section></main>;
}
