# Shared UI primitives

## Logo — `src/components/Logo.tsx`

Maymoon wordmark and MM mark. Props: `inverse?: boolean`.

```tsx
import { brand } from '../config/brand';

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`brand ${inverse ? 'brand--inverse' : ''}`} aria-label={`${brand.name} ana sayfa`}>
      <span className="brand-mark" aria-hidden="true"><i>M</i><i>M</i></span>
      <span>{brand.name}</span>
    </span>
  );
}
```

## Mockup — `src/components/Mockup.tsx`

Three-layer product presentation: base photo, mapped print layer and texture overlay.

```tsx
import type { CSSProperties, ReactNode } from 'react';
import { mockupImages, mockupPrintAreas } from '../data/mockups';
import type { ShirtColor, Side } from '../types';
interface MockupProps { color: ShirtColor; side?: Side; designUrl?: string; designContent?: ReactNode; editor?: ReactNode; showGuide?: boolean; className?: string; label?: string; }
export function Mockup({ color, side = 'front', designUrl, designContent, editor, showGuide = false, className = '', label }: MockupProps) {
  const area = mockupPrintAreas[side];
  const areaStyle = { '--print-left': `${area.leftPercent}%`, '--print-top': `${area.topPercent}%`, '--print-width': `${area.widthPercent}%`, '--print-height': `${area.heightPercent}%` } as CSSProperties;
  return (
    <div className={`realistic-mockup ${className}`} style={areaStyle} aria-label={label ?? `${side === 'front' ? 'Ön' : 'Arka'} yüz tişört mockup'ı`}>
      <img className="mockup-base" src={mockupImages[side][color]} alt="" aria-hidden="true" />
      <div className={`mockup-print-layer ${showGuide ? 'mockup-print-layer--guide' : ''}`}>{designUrl && <img src={designUrl} alt="Tasarım baskı önizlemesi" />}{designContent}{editor}{showGuide && <span className="mockup-guide-label">30 × 40 CM BASKI ALANI</span>}</div>
      <div className="mockup-texture-overlay" aria-hidden="true" />
    </div>
  );
}
```

## CSS primitives

Buttons and product cards are CSS primitives in `src/styles.css`: `.button`, `.button--primary`, `.button--ghost`, `.product-card`, `.product-image`, `.product-info`, and `.product-footer`.
