# apps/web — AGENTS.md

Next.js 16.2 + React 19 + Tailwind v4. Con `src/`: App Router en `src/app/`. Doble vía de datos (Fase 7): sin `NEXT_PUBLIC_API_URL` todo es `localStorage` (mock); con la URL, auth + catálogo público + checkout + pedidos usan el backend (`src/lib/api/`, cookie httpOnly). El panel admin sigue 100% en `localStorage` (pendiente migrar).

## Dónde está qué

- `src/app/(home)/` — home: `HomeHero` + `HomeCategories` (foto admin → primer producto → fallback) + `HomeProducts` (destacados). `src/app/catalogo/` — `CatalogGrouped` (4 por categoría) y `[slug]/` con `CatalogGrid`. `src/app/producto/[slug]/` — `ProductDetail` + `RelatedProducts`.
- `src/app/(admin)/admin/` — admin: productos, inventario, pedidos, pagos, envíos, configuración (categorías con foto, blog, faq). `src/components/admin/` — formularios + uploaders.
- `src/components/product/` — `ProductCard` (foto cuadrada `aspect-square`, grilla 4/fila en desktop), `catalog-*.tsx`.
- `src/config/` — `products.ts` (seed + `catalogCategories`), `constants.ts` (`FEATURED_PRODUCTS_COUNT = 8`), `seed-data.ts`.
- `src/lib/utils/` — `routes.ts` (`ROUTES.*`), `format.ts`, `inventory.ts`.
- `src/lib/api/` — `client.ts` (`apiFetch`, `isApiEnabled`, `ApiError`), `catalog.ts` (mapea respuestas a tipos del frontend), `orders.ts` (checkout, cupón, pedidos, devoluciones, MP). Contrato en `apps/web/.env.example`.

## Reglas web (evitan los errores repetidos)

- Grillas de producto: `grid-cols-2` móvil → `lg:grid-cols-4` desktop. `sizes` de `ProductCard`: `50vw` móvil/tablet, `25vw` desktop.
- Foto categoría: `cat.image ||` primer producto activo `|| FALLBACK_IMAGE`; sin productos la tarjeta se oculta. No existe `parentId` (eliminado: categorías planas por `order`).
- Cambiar el seed de `config/products.ts` cambia el hash y **re-siembran los productos** (se pierden ediciones locales del navegador).
- `FEATURED_PRODUCTS_COUNT` es a la vez límite del admin y cantidad mostrada en la home (2 filas de 4).
- Skeletons (`loading.tsx`) deben replicar la grilla real para evitar CLS.
- Vía API (`NEXT_PUBLIC_API_URL` seteada): `auth-context` usa `/auth/*`; hooks `use-products|categories|blog|site-config` revalidan contra el backend (fallback a lo local si falla); checkout/cupón/pedidos/devoluciones van a `/orders|/coupons|/returns`; MP redirige a `initPoint` (mock sin token). Los ids del backend son cuid (no `"1"`): no mezclar sesiones entre modos sin limpiar `localStorage`. Carrito y admin no migrados (usan snapshots/tiendas locales).

## Comandos

- `pnpm --filter @apps/web dev | build | lint | check-types`.
