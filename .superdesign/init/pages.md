# Page dependency trees

## `/` — Catalog
- `src/components/Catalog.tsx`
  - `src/components/Artwork.tsx`
    - `src/components/Mockup.tsx`
      - `src/data/mockups.ts`
      - `src/types.ts`
  - `src/data/products.ts`
  - `src/lib/pricing.ts`
- Shell: `src/App.tsx` → `src/components/Header.tsx` → `src/components/Logo.tsx`
- Style: `src/styles.css`

## `/koleksiyon/:slug`
- `src/components/ProductDetail.tsx` → `src/components/Artwork.tsx` → `src/components/Mockup.tsx`
- `src/data/products.ts`, `src/lib/pricing.ts`, `src/types.ts`

## `/studio`
- `src/components/Studio.tsx`
  - `src/components/FabricEditor.tsx`, `src/components/Mockup.tsx`, `src/components/OrderModals.tsx`
  - `src/data/products.ts`, `src/data/symbols.ts`, `src/data/mockups.ts`
  - `src/lib/draftStorage.ts`, `src/lib/pricing.ts`, `src/types.ts`

## `/sepet`
- `src/components/CartPage.tsx` → `src/components/Artwork.tsx` → `src/components/Mockup.tsx`
- Shell: `src/App.tsx`, `src/components/Header.tsx`, `src/components/Logo.tsx`
