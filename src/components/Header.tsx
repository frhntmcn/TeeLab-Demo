import { ShoppingBag } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { Logo } from './Logo';

export function Header({ cartCount }: { cartCount: number }) {
  return (
    <header className="site-header">
      <Link className="logo-button" to="/" aria-label="TeeLab ana sayfa"><Logo /></Link>
      <nav aria-label="Ana menü">
        <NavLink to="/#koleksiyon">Koleksiyon</NavLink>
        <NavLink to="/studio">Kendin Tasarla</NavLink>
      </nav>
      <Link className="cart-button" to="/sepet" aria-label={`Sepet, ${cartCount} ürün`}>
        <ShoppingBag size={20} /><span>{cartCount}</span>
      </Link>
    </header>
  );
}
