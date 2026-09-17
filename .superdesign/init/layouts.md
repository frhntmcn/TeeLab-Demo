# Shared layouts

## Header — `src/components/Header.tsx`

```tsx
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { brand } from '../config/brand';
import { Logo } from './Logo';
export function Header({ cartCount }: { cartCount: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const closeMenu = () => setMenuOpen(false);
  useEffect(() => closeMenu(), [location.pathname, location.hash]);
  return <header className="site-header"><Link className="logo-button" to="/" aria-label={`${brand.name} ana sayfa`}><Logo /></Link><nav className="desktop-nav" aria-label="Ana menü"><NavLink to="/" end>Ana Sayfa</NavLink><Link to="/#koleksiyon">Koleksiyon</Link><NavLink className="nav-studio-link" to="/studio">Kendin Tasarla</NavLink></nav><div className="header-actions"><Link className="cart-button" to="/sepet" aria-label={cartCount ? `Sepet, ${cartCount} ürün` : 'Sepet, boş'}><ShoppingBag size={20} /><span>{cartCount}</span></Link><button className="menu-button" type="button" aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button></div></header>;
}
```

## App shell — `src/App.tsx`

```tsx
<div className="app-shell">
  <ScrollManager />
  {!isStudio && <Header cartCount={cartCount} />}
  <Routes>{/* catalog, product, studio and cart routes */}</Routes>
  {!isStudio && <footer><Logo inverse /><p>{brand.tagline} · {brand.city}'da tasarlandı.</p><nav aria-label="Alt menü"><a href="/#koleksiyon">Koleksiyon</a><a href="/studio">Stüdyo</a><a href="/sepet">Sepet</a></nav><small>© 2026 {brand.name} · Dijital baskı stüdyosu</small></footer>}
</div>
```
