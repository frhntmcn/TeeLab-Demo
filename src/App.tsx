import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Catalog } from './components/Catalog';
import { CartPage } from './components/CartPage';
import { Header } from './components/Header';
import { Logo } from './components/Logo';
import { ProductDetail } from './components/ProductDetail';
import { products } from './data/products';
import { brand } from './config/brand';
import type { CartItem } from './types';
import { CART_STORAGE_KEY, deserializeCart, mergeCartItem, serializeCart, updateCartQuantity } from './lib/cart';
import { getStorefrontProductRecord, STOREFRONT_MANAGEMENT_EVENT } from './lib/storefrontManagement';
import { fetchWooCommerceProductOverrides } from './lib/woocommerce';

const Studio = lazy(() => import('./components/Studio').then((module) => ({ default: module.Studio })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const readCart = () => deserializeCart(window.localStorage.getItem(CART_STORAGE_KEY));

function ScrollManager() {
  const location = useLocation();
  useEffect(() => {
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
      const override = overrides[slug];
      if (cancelled || !override) return;
      setRecord((current) => current ? { ...current, stock: override.stock, product: { ...current.product, price: override.price } } : current);
    });
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    document.title = product ? `${product.name} — ${brand.name}` : `Ürün bulunamadı — ${brand.name}`;
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
        <Route path="/yonetim" element={<Suspense fallback={<div className="route-loader"><Logo /><span>Yönetim paneli hazırlanıyor…</span></div>}><AdminDashboard /></Suspense>} />
        <Route path="/sepet" element={<CartPage items={cart} onUpdate={updateQuantity} onComplete={() => setCart([])} onContinue={() => navigate('/')} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {hasStorefrontShell && <footer>
        <Logo inverse />
        <p>{brand.tagline} · {brand.city}'da tasarlandı.</p>
        <nav aria-label="Alt menü"><a href="/#koleksiyon">Koleksiyon</a><a href="/studio">Stüdyo</a><a href="/sepet">Sepet</a></nav>
        <small>© 2026 {brand.name} · Dijital baskı stüdyosu</small>
      </footer>}
    </div>
  );
}
