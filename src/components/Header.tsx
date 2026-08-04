import { ShoppingBag } from 'lucide-react';
import type { View } from '../types';
import { Logo } from './Logo';

export function Header({ navigate, cartCount }: { navigate: (view: View) => void; cartCount: number }) {
  return (
    <header className="site-header">
      <button className="logo-button" onClick={() => navigate('home')}><Logo /></button>
      <nav aria-label="Ana menü">
        <button onClick={() => navigate('home')}>Koleksiyon</button>
        <button onClick={() => navigate('studio')}>Kendin Tasarla</button>
      </nav>
      <button className="cart-button" aria-label={`Sepet, ${cartCount} ürün`}>
        <ShoppingBag size={20} /><span>{cartCount}</span>
      </button>
    </header>
  );
}
