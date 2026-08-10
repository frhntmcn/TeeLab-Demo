# Routes

React Router DOM is configured in `src/App.tsx`.

| URL | Component | Layout |
| --- | --- | --- |
| `/` | `src/components/Catalog.tsx` | Header + footer |
| `/koleksiyon/:slug` | `src/components/ProductDetail.tsx` | Header + footer |
| `/studio` | lazy `src/components/Studio.tsx` | Studio top bar |
| `/sepet` | `src/components/CartPage.tsx` | Header + footer |

```tsx
<Routes>
  <Route path="/" element={<Catalog onCustomize={() => navigate('/studio')} onProduct={(product) => navigate(`/koleksiyon/${product.id}`)} />} />
  <Route path="/koleksiyon/:slug" element={<ProductRoute onAdd={addToCart} />} />
  <Route path="/studio" element={<Suspense fallback={<div className="route-loader"><Logo /><span>Stüdyo hazırlanıyor…</span></div>}><Studio onBack={() => navigate('/')} /></Suspense>} />
  <Route path="/sepet" element={<CartPage items={cart} onUpdate={updateQuantity} onContinue={() => navigate('/')} />} />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```
