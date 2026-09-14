# Arquitectura — DYDALO

Ecommerce streetwear (tienda pública + admin interno). Monorepo `pnpm + turbo`.

## apps/web (Next.js 16.2 + React 19 + Tailwind v4, con `src/`)

- Home (`app/(home)/`): `HomeHero` → `HomeCategories` (grilla 4/fila, foto admin → primer producto → fallback) → `HomeProducts` (destacados, grilla 4/fila).
- Catálogo: `app/catalogo/` (`CatalogGrouped`, 4 por categoría) y `app/catalogo/[slug]/` (`CatalogGrid` + orden). Detalle: `app/producto/[slug]/` (`ProductDetail` + galería + `RelatedProducts`).
- Favoritos, carrito, cuenta, blog, páginas legales/ayuda como rutas App Router.
- Admin (`app/(admin)/admin/`): dashboard, productos, inventario, pedidos, pagos, envíos, devoluciones, compras, proveedores, cupones, usuarios, analíticas, auditoría, configuración (categorías, blog, faq). Formularios en `components/admin/`.
- Estado: stores `lib/stores/data-store.*` en `localStorage`, seed desde `config/products.ts` + `config/seed-data.ts`; cambiar el seed cambia el hash y re-siembran los datos (se pierden ediciones locales).
- Rutas centralizadas en `lib/utils/routes.ts` (`ROUTES.*`). Fotos de producto cuadradas (`aspect-square`, `object-cover`).

## apps/api (NestJS 11 + Prisma v6 + Postgres 16 en Docker)

- Fundaciones (Fase 2): `ConfigModule` global con validación zod (falla rápido), `PrismaModule` global + `PrismaService` (`$connect/$disconnect`), `GET /health` (chequeo real `SELECT 1`, sin rate-limit), `ValidationPipe({whitelist, transform})` global, `cookie-parser`, CORS solo web (`localhost:3000` + credenciales), `ThrottlerGuard` global (100/min), logger pino.
- Convención: módulos por feature; los servicios usan repositorios que inyectan `PrismaService`, nunca `PrismaClient` directo. DTOs en `@Body()` con import normal (nunca `import type`: borra la metadata y el pipe no valida).
- Auth (Fase 3): `POST /auth/register|login|logout`, `GET /auth/me` con cookie `access_token` httpOnly (`SameSite=Lax`, `Secure` en prod); `JwtAuthGuard` + `RolesGuard` (`@Roles`, roles `admin/customer`); `JwtModule` global; throttle 20/min en register/login. Modelos `User` + `Address` (migración `auth-users-addresses`); seed idempotente de `diego@`/`david@` como admin. `GET /users/me`, `PATCH /users/me|/me/password`; CRUD `/addresses` + `POST /addresses/:id/default` (default única por usuario).
- Catálogo (Fase 4): `Category`, `Product` (+`ProductVariant` con `key` estable e ids estables entre seeds), `BlogPost` (autor snapshot), `SiteConfig` singleton, `AuditLog` append-only (migración `catalog-blog-config-audit`). Públicos `GET /categories|/products[/:slug]|/blog[/:slug]|/site-config` (solo activos/publicados); admin `GET|POST|PATCH|DELETE /admin/categories|products|blog` + variantes (sin `stock`) + `PATCH /admin/site-config` + `GET /admin/audit`; `AuditModule` global; JWT con `name` para auditoría. Seed espejo del frontend (`prisma/seed-catalog.ts` importa `@/config/products`, 8 cat / 80 prod / 549 var).
- Ventas (Fase 5): `Coupon` (+`CouponRedemption` 1-uso), `Order` (+`OrderItem` con foto `unitCost`, snapshot dirección, `statusHistory`), `PaymentAttempt` (11 estados, secuencial por pedido), `StockMovement` sin FKs (migración `sales-coupons-orders-payments-kardex`). `POST /orders` (checkout en 1 tx: precios DB + cupón + guardia stock + reserva 24h + intento), `GET /orders`, `PATCH :id/cancel`, `POST :id/retry`; admin manual + transiciones + `PATCH :id/payment` + webhook simulado idempotente + alertas + `expire-run` + worker `@Cron` 15min; `POST /coupons/validate`; `POST /admin/inventory/adjust` + kardex. Aprobación = auditoría (sin movimiento extra).
- Logística/postventa (Fase 6): `Supplier` (baja lógica), `PurchaseOrder` (+`PurchaseLine` con `variantId?`, código `OC-###`), `ShipmentEvent`, `ReturnRequest` (+`ReturnItem`, código `RMA-###`) (migraciones `logistics-postventa` + `purchase-line-variant`). `POST /admin/orders/:id/shipment` (máquina por fulfillment + guía/evidencia/DNI) + `GET /orders/:id/shipment` (tracking cliente); CRUD `/admin/suppliers`; `POST /admin/purchases` + `:id/receive` (parcial/total, reparto o variante forzada, `costPrice`) + `:id/cancel`; `POST /returns` + `/admin/returns` (máquina RMA, inspección con restock/damage, cierre con `devuelto`+reembolso+merma neteada o informativa).
- Integración + MP (Fase 7): `src/mp/` (Checkout Pro por REST directo + `POST /payments/webhook` firmado HMAC idempotente + `POST /orders/:id/mp-preference` con modo mock sin token; `binary_mode: false`); `GET /orders/:id/attempts`; `costPrice` oculto en lecturas públicas; CORS por `FRONTEND_URL(S)`; JWT placeholder prohibido en prod; `db:backup` (pg_dump a `backups/`). La web usa el backend tras `NEXT_PUBLIC_API_URL` (`src/lib/api/`: auth real, catálogo/blog lectura, checkout, cupones, pedidos, devoluciones, MP); admin aún local.
- DB `dydalo-postgres` (`postgres:16-alpine`, `5432`, volumen `pgdata`, `healthcheck pg_isready`) vía `docker-compose.yml` en raíz; `DATABASE_URL` en `apps/api/.env` (gitignored, contrato en `.env.example`); scripts `db:*` y `prisma:*` en `apps/api/package.json`; schema en `apps/api/prisma/schema.prisma` (v6 `prisma-client-js`, sin modelos aún). Puertos: web `3000` / api `3001` / db `5432`. La web no lo consume aún.

## packages/*

- `eslint-config` y `typescript-config` compartidos por el monorepo.
