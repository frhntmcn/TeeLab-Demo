import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Catalog } from './components/Catalog';
import { CartPage } from './components/CartPage';
import { Header } from './components/Header';
import { Logo } from './components/Logo';
import { ProductDetail } from './components/ProductDetail';
import { products } from './data/products';
import type { CartItem } from './types';
import { CART_STORAGE_KEY, deserializeCart, mergeCartItem, serializeCart, updateCartQuantity } from './lib/cart';

const Studio = lazy(() => import('./components/Studio').then((module) => ({ default: module.Studio })));
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
  const product = products.find((item) => item.id === slug);

  useEffect(() => {
    document.title = product ? `${product.name} — TeeLab` : 'Ürün bulunamadı — TeeLab';
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
      brand: { '@type': 'Brand', name: 'TeeLab' },
      offers: { '@type': 'Offer', priceCurrency: 'TRY', price: product.price, availability: 'https://schema.org/InStock' },
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, [product]);

  if (!product) return <Navigate to="/" replace />;
  return <ProductDetail product={product} onBack={() => navigate('/#koleksiyon')} onCustomize={() => navigate('/studio')} onAdd={onAdd} />;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isStudio = location.pathname === '/studio';
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
      {!isStudio && <Header cartCount={cartCount} />}
      <Routes>
        <Route path="/" element={<Catalog onCustomize={() => navigate('/studio')} onProduct={(product) => navigate(`/koleksiyon/${product.id}`)} />} />
        <Route path="/koleksiyon/:slug" element={<ProductRoute onAdd={addToCart} />} />
        <Route path="/studio" element={<Suspense fallback={<div className="route-loader"><Logo /><span>Stüdyo hazırlanıyor…</span></div>}><Studio onBack={() => navigate('/')} onAdd={addToCart} /></Suspense>} />
        <Route path="/sepet" element={<CartPage items={cart} onUpdate={updateQuantity} onComplete={() => setCart([])} onContinue={() => navigate('/')} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isStudio && <footer>
        <Logo inverse />
        <p>Fikrini giy. · İstanbul'da tasarlandı.</p>
        <nav aria-label="Alt menü"><a href="/#koleksiyon">Koleksiyon</a><a href="/studio">Stüdyo</a><a href="/sepet">Sepet</a></nav>
        <small>© 2026 TeeLab · Dijital baskı stüdyosu</small>
      </footer>}
    </div>
  );
}
