import { ArrowLeft, SearchX } from 'lucide-react';

export function NotFoundPage({ onReturn }: { onReturn: () => void }) {
  return (
    <main className="not-found-page">
      <span className="not-found-page__icon"><SearchX aria-hidden="true" /></span>
      <p className="not-found-page__code">404</p>
      <h1>Aradığın ürün burada değil.</h1>
      <p>Bağlantı güncel olmayabilir ya da ürün koleksiyondan kaldırılmış olabilir.</p>
      <button className="button button--ink" type="button" onClick={onReturn}>
        <ArrowLeft size={17} /> Koleksiyona dön
      </button>
    </main>
  );
}
