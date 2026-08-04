import { useState } from 'react';
import { Catalog } from './components/Catalog';
import { Header } from './components/Header';
import { ProductDetail } from './components/ProductDetail';
import { Studio } from './components/Studio';
import { Logo } from './components/Logo';
import { products } from './data/products';
import type { Product, View } from './types';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0]);
  const [cartCount, setCartCount] = useState(0);
  const navigate = (next: View) => { setView(next); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openProduct = (product: Product) => { setSelectedProduct(product); navigate('product'); };

  if (view === 'studio') return <Studio onBack={() => navigate('home')} />;
  return (
    <div className="app-shell">
      <Header navigate={navigate} cartCount={cartCount} />
      {view === 'home' ? <Catalog onCustomize={() => navigate('studio')} onProduct={openProduct} /> : <ProductDetail product={selectedProduct} onBack={() => navigate('home')} onCustomize={() => navigate('studio')} onAdd={(qty) => setCartCount((count) => count + qty)} />}
      <footer><Logo inverse /><p>Fikrini giy. · İstanbul'da tasarlandı.</p><small>© 2026 TeeLab Demo. Gerçek satış veya üretim hizmeti sunmaz.</small></footer>
    </div>
  );
}
