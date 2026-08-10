# Shared layouts

## Header — `src/components/Header.tsx`

```tsx
import { ShoppingBag } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { Logo } from './Logo';
export function Header({ cartCount }: { cartCount: number }) {
  return <header className="site-header"><Link className="logo-button" to="/" aria-label="TeeLab ana sayfa"><Logo /></Link><nav aria-label="Ana menü"><NavLink to="/#koleksiyon">Koleksiyon</NavLink><NavLink to="/studio">Kendin Tasarla</NavLink></nav><Link className="cart-button" to="/sepet" aria-label={`Sepet, ${cartCount} ürün`}><ShoppingBag size={20} /><span>{cartCount}</span></Link></header>;
}
```

## App shell — `src/App.tsx`

```tsx
<div className="app-shell">
  <ScrollManager />
  {!isStudio && <Header cartCount={cartCount} />}
  <Routes>{/* catalog, product, studio and cart routes */}</Routes>
  {!isStudio && <footer><Logo inverse /><p>Fikrini giy. · İstanbul'da tasarlandı.</p><nav aria-label="Alt menü"><a href="/#koleksiyon">Koleksiyon</a><a href="/studio">Stüdyo</a><a href="/sepet">Sepet</a></nav><small>© 2026 TeeLab · Dijital baskı stüdyosu</small></footer>}
</div>
```
