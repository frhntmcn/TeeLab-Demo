import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Catalog } from './components/Catalog';
import { CartPage } from './components/CartPage';
import { Header } from './components/Header';
import { Logo } from './components/Logo';
import { NotFoundPage } from './components/NotFoundPage';
import { ProductDetail } from './components/ProductDetail';
import { products } from './data/products';
import type { CartItem } from './types';
import { mergeCartItem } from './lib/cart';
import { getVariantStock, isCartInStock } from './lib/stock';

const Studio = lazy(() => import('./components/Studio').then((module) => ({ default: module.Studio })));
const CART_KEY = 'teelab-demo-cart-v1';

function readCart(): CartItem[] {
  try {
    const value = window.localStorage.getItem(CART_KEY);
    if (!value) return [];
    const items = JSON.parse(value) as Partial<CartItem>[];
    return items.filter((item) => item.id && item.productId && item.color && item.size).map((item) => ({
      ...item,
      designHash: item.designHash ?? `catalog:${item.artwork ?? 'legacy'}`,
    } as CartItem));
  } catch {
    return [];
  }
}

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

  if (!product) return <NotFoundPage onReturn={() => navigate('/')} />;
  return <ProductDetail product={product} onBack={() => navigate('/#koleksiyon')} onCustomize={() => navigate('/studio')} onAdd={onAdd} />;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isStudio = location.pathname === '/studio';
  const [cart, setCart] = useState<CartItem[]>(readCart);
  const cartCount = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart]);

  useEffect(() => {
    try { window.localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* Demo sepeti depolama olmadan da çalışır. */ }
  }, [cart]);

  const addToCart = (next: CartItem) => {
    setCart((current) => {
      const product = products.find((item) => item.id === next.productId);
      if (product && !next.isCustom) {
        const currentQuantity = current.filter((item) => item.productId === next.productId && item.color === next.color && item.size === next.size).reduce((total, item) => total + item.quantity, 0);
        if (currentQuantity + next.quantity > getVariantStock(product, next.color, next.size)) return current;
      }
      return mergeCartItem(current, next);
    });
  };

  const updateQuantity = (id: string, quantity: number) => setCart((current) => current.map((item) => {
    if (item.id !== id) return item;
    const product = products.find((candidate) => candidate.id === item.productId);
    const max = product && !item.isCustom ? getVariantStock(product, item.color, item.size) : quantity;
    return { ...item, quantity: Math.min(quantity, max) };
  }).filter((item) => item.quantity > 0));
  const completeOrder = () => {
    if (!isCartInStock(cart, products)) return false;
    setCart([]);
    return true;
  };

  return (
    <div className="app-shell">
      <ScrollManager />
      {!isStudio && <Header cartCount={cartCount} />}
      <Routes>
        <Route path="/" element={<Catalog onCustomize={() => navigate('/studio')} onProduct={(product) => navigate(`/koleksiyon/${product.id}`)} />} />
        <Route path="/koleksiyon/:slug" element={<ProductRoute onAdd={addToCart} />} />
        <Route path="/studio" element={<Suspense fallback={<div className="route-loader"><Logo /><span>Stüdyo hazırlanıyor…</span></div>}><Studio onBack={() => navigate('/')} onAdd={addToCart} /></Suspense>} />
        <Route path="/sepet" element={<CartPage items={cart} onUpdate={updateQuantity} onComplete={completeOrder} onContinue={() => navigate('/')} />} />
        <Route path="*" element={<NotFoundPage onReturn={() => navigate('/')} />} />
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
