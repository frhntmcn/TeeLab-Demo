import { brand } from '../config/brand';

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`brand ${inverse ? 'brand--inverse' : ''}`} aria-label={`${brand.name} ana sayfa`}>
      <span className="brand-mark" aria-hidden="true"><i>M</i><i>M</i></span>
      <span>{brand.name}</span>
    </span>
  );
}
