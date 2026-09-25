import { brand } from '../config/brand';

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`brand ${inverse ? 'brand--inverse' : ''}`} aria-label={`${brand.name} ana sayfa`}>
      <img className="brand-logo" src="/favicon.svg" width="34" height="34" alt="" aria-hidden="true" />
      <span>{brand.name}</span>
    </span>
  );
}
