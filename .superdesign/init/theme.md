# Theme

## Compact token summary

- Vite + React + TypeScript; custom vanilla CSS.
- Navy `#0F172A`, purple `#7C3AED`, paper `#F8FAFC`, muted `#475569`, line `#E2E8F0`.
- Inter/system body; Manrope display fallback.
- Radii 8–28px; shadow `0 24px 70px rgba(15,23,42,.12)`.
- Breakpoints: 1200px, 980px, 680px.

## Raw source tokens — `src/styles.css`

```css
:root { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color:#0f172a; background:#f8fafc; font-synthesis:none; --navy:#0f172a; --purple:#7c3aed; --paper:#f8fafc; --muted:#475569; --line:#e2e8f0; --shadow:0 24px 70px rgba(15,23,42,.12); }
* { box-sizing:border-box; }
html { scroll-behavior:smooth; }
body { margin:0; min-width:320px; background:#f8fafc; color:var(--navy); }
button,input,select,textarea { font:inherit; }
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible { outline:3px solid rgba(124,58,237,.3); outline-offset:2px; }
```

The complete stylesheet is `src/styles.css` (217 lines) and is passed whole to design generation because it is below the 900-line threshold.
