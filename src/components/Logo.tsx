export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`brand ${inverse ? 'brand--inverse' : ''}`} aria-label="TeeLab ana sayfa">
      <span className="brand-mark" aria-hidden="true"><i>T</i><i>L</i></span>
      <span>Tee<span>Lab</span></span>
    </span>
  );
}
