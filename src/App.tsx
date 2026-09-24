import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Catalog } from './components/Catalog';
import { CartPage } from './components/CartPage';
import { Header } from './components/Header';
import { Logo } from './components/Logo';
import { ProductDetail } from './components/ProductDetail';
import { AdminAccessGate } from './components/AdminAccessGate';
import { AccountPage } from './components/AccountPage';
import { CookieConsent } from './components/CookieConsent';
import { LegalPage } from './components/LegalPage';
import { InformationPage } from './components/InformationPage';
import { products } from './data/products';
import { brand } from './config/brand';
import type { CartItem } from './types';
import { CART_STORAGE_KEY, deserializeCart, mergeCartItem, serializeCart, updateCartQuantity } from './lib/cart';
import { getStorefrontProductRecord, STOREFRONT_MANAGEMENT_EVENT } from './lib/storefrontManagement';
import { fetchWooCommerceProductOverrides, getWooCommerceProductOverride } from './lib/woocommerce';

const Studio = lazy(() => import('./components/Studio').then((module) => ({ default: module.Studio })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const readCart = () => deserializeCart(window.localStorage.getItem(CART_STORAGE_KEY));

function ScrollManager() {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    const routeProduct = path.startsWith('/koleksiyon/') ? products.find((item) => item.id === decodeURIComponent(path.slice('/koleksiyon/'.length))) : undefined;
    const infoTitles: Record<string, string> = { '/hakkimizda': 'Maymoon hakkında', '/iletisim': 'İletişim', '/sss': 'Sık sorulan sorular', '/kurumsal': 'Kurumsal ve toplu sipariş' };
    const pageTitle = routeProduct ? `${routeProduct.name} — ${brand.name}` : infoTitles[path] ? `${infoTitles[path]} — ${brand.name}` : path === '/studio' ? `Tasarım Stüdyosu — ${brand.name}` : path === '/yonetim' ? `Yönetim — ${brand.name}` : path === '/hesabim' ? `Hesabım — ${brand.name}` : path === '/sepet' ? `Sepet — ${brand.name}` : path.startsWith('/hukuk/') ? `Bilgilendirme — ${brand.name}` : `${brand.name} — Fikrini giy.`;
    const description = routeProduct?.description ?? (path === '/kurumsal' ? 'Maymoon kurumsal ve toplu siparişleri için teklif talebi oluştur.' : path === '/iletisim' ? 'Maymoon ile e-posta üzerinden iletişime geç.' : path === '/sss' ? 'Maymoon tasarım stüdyosu, ürünler ve satış hazırlıkları hakkında sık sorulan sorular.' : 'Özgün koleksiyonları keşfet veya önlü arkalı kendi tişörtünü tasarla.');
    document.title = pageTitle;
    const upsertMeta = (key: string, value: string, attribute: 'name' | 'property' = 'name') => {
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, key); document.head.appendChild(element); }
      element.content = value;
    };
    const canonicalPath = routeProduct ? `/koleksiyon/${routeProduct.id}` : infoTitles[path] ? path : '/';
    const canonicalUrl = `${brand.website}${canonicalPath}`;
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = canonicalUrl;
    const privatePage = !routeProduct && path !== '/' && !infoTitles[path];
    upsertMeta('robots', privatePage ? 'noindex, nofollow' : 'index, follow');
    upsertMeta('description', description);
    upsertMeta('og:title', pageTitle, 'property');
    upsertMeta('og:description', description, 'property');
    upsertMeta('og:url', canonicalUrl, 'property');
    upsertMeta('twitter:title', pageTitle);
    upsertMeta('twitter:description', description);
    if (location.hash) {
      window.setTimeout(() => document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth' }), 0);
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname, location.hash]);
  return null;
}

function ProductRoute({ onAdd }: { onAdd: (item: CartItem) => void }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(() => slug ? getStorefrontProductRecord(products, slug) : undefined);
  const product = record?.product;

  useEffect(() => {
    const refreshProduct = () => setRecord(slug ? getStorefrontProductRecord(products, slug) : undefined);
    refreshProduct();
    window.addEventListener('storage', refreshProduct);
    window.addEventListener(STOREFRONT_MANAGEMENT_EVENT, refreshProduct);
    return () => {
      window.removeEventListener('storage', refreshProduct);
      window.removeEventListener(STOREFRONT_MANAGEMENT_EVENT, refreshProduct);
    };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    if (!slug) return;
    fetchWooCommerceProductOverrides().then((overrides) => {
      const override = getWooCommerceProductOverride(overrides, slug);
      if (cancelled || !override) return;
      setRecord((current) => current ? { ...current, stock: override.stock, product: { ...current.product, price: override.price } } : current);
    });
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    const existing = document.getElementById('product-json-ld');
    existing?.remove();
    if (!product) return;
    const script = document.createElement('script');
    script.id = 'product-json-ld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      brand: { '@type': 'Brand', name: brand.name },
      offers: { '@type': 'Offer', priceCurrency: 'TRY', price: product.price, availability: (record?.stock ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, [product, record?.stock]);

  if (!product || !record) return <Navigate to="/" replace />;
  return <ProductDetail product={product} stock={record.stock} onBack={() => navigate('/#koleksiyon')} onCustomize={() => navigate('/studio')} onAdd={onAdd} />;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isStudio = location.pathname === '/studio';
  const isAdmin = location.pathname === '/yonetim';
  const hasStorefrontShell = !isStudio && !isAdmin;
  const [cart, setCart] = useState<CartItem[]>(readCart);
  const cartCount = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart]);

  useEffect(() => {
    try { window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(cart)); } catch { /* Demo sepeti depolama olmadan da çalışır. */ }
  }, [cart]);

  const addToCart = (next: CartItem) => {
    setCart((current) => mergeCartItem(current, next));
  };

  const updateQuantity = (id: string, quantity: number) => setCart((current) => updateCartQuantity(current, id, quantity));

  return (
    <div className="app-shell">
      <ScrollManager />
      {hasStorefrontShell && <Header cartCount={cartCount} />}
      <Routes>
        <Route path="/" element={<Catalog onCustomize={() => navigate('/studio')} onProduct={(product) => navigate(`/koleksiyon/${product.id}`)} />} />
        <Route path="/koleksiyon/:slug" element={<ProductRoute onAdd={addToCart} />} />
        <Route path="/studio" element={<Suspense fallback={<div className="route-loader"><Logo /><span>Stüdyo hazırlanıyor…</span></div>}><Studio onBack={() => navigate('/')} onAdd={addToCart} /></Suspense>} />
        <Route path="/hesabim" element={<AccountPage />} />
        <Route path="/hakkimizda" element={<InformationPage kind="about" />} />
        <Route path="/iletisim" element={<InformationPage kind="contact" />} />
        <Route path="/sss" element={<InformationPage kind="faq" />} />
        <Route path="/kurumsal" element={<InformationPage kind="business" />} />
        <Route path="/hukuk/:document" element={<LegalPage />} />
        <Route path="/yonetim" element={<AdminAccessGate><Suspense fallback={<div className="route-loader"><Logo /><span>Yönetim paneli hazırlanıyor…</span></div>}><AdminDashboard /></Suspense></AdminAccessGate>} />
        <Route path="/sepet" element={<CartPage items={cart} onUpdate={updateQuantity} onComplete={() => setCart([])} onContinue={() => navigate('/')} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {hasStorefrontShell && <footer>
        <Logo inverse />
        <p>{brand.tagline} · {brand.city}'da tasarlandı.</p>
        <nav aria-label="Alt menü"><a href="/#koleksiyon">Koleksiyon</a><a href="/studio">Stüdyo</a><a href="/kurumsal">Kurumsal sipariş</a><a href="/hakkimizda">Hakkımızda</a><a href="/iletisim">İletişim</a><a href="/sss">SSS</a><a href="/sepet">Sepet</a><a href="/hukuk/kvkk">KVKK</a><a href="/hukuk/gizlilik">Gizlilik</a><a href="/hukuk/teslimat-iade">Teslimat ve iade</a></nav>
        <small>© 2026 {brand.name} · Dijital baskı stüdyosu</small>
      </footer>}
      <CookieConsent />
    </div>
  );
}
