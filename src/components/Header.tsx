import { Menu, ShoppingBag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { brand } from '../config/brand';
import { Logo } from './Logo';

export function Header({ cartCount }: { cartCount: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    closeMenu();
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    document.body.classList.add('menu-is-open');
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('menu-is-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const collectionActive = location.pathname === '/' && location.hash === '#koleksiyon';

  return (
    <header className="site-header">
      <Link className="logo-button" to="/" aria-label={`${brand.name} ana sayfa`}><Logo /></Link>
      <nav className="desktop-nav" aria-label="Ana menü">
        <NavLink to="/" end>Ana Sayfa</NavLink>
        <Link className={collectionActive ? 'active' : undefined} to="/#koleksiyon">Koleksiyon</Link>
        <NavLink className="nav-studio-link" to="/studio">Kendin Tasarla</NavLink>
      </nav>
      <div className="header-actions">
        <Link className="cart-button" to="/sepet" aria-label={cartCount ? `Sepet, ${cartCount} ürün` : 'Sepet, boş'}>
        <ShoppingBag size={20} /><span>{cartCount}</span>
        </Link>
        <button className="menu-button" type="button" aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
      {menuOpen && <>
        <button className="menu-scrim" type="button" aria-label="Menüyü kapat" onClick={closeMenu} />
        <nav className="mobile-nav" id="mobile-navigation" aria-label="Mobil ana menü">
          <NavLink to="/" end onClick={closeMenu}>Ana Sayfa</NavLink>
          <Link to="/#koleksiyon" onClick={closeMenu}>Koleksiyon</Link>
          <NavLink className="button button--ink mobile-studio-link" to="/studio" onClick={closeMenu}>Kendin Tasarla</NavLink>
          <Link to="/sepet" onClick={closeMenu}>Sepet{cartCount ? ` (${cartCount})` : ''}</Link>
        </nav>
      </>}
    </header>
  );
}
