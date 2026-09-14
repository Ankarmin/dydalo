# Decisiones — DYDALO

Registro de decisiones vigentes (fecha + motivo). Solo cambios de arquitectura/stack/contratos.

## 2026-09-14 — Sin backend: estado en `localStorage` + reseed por hash

- Motivo: operar tienda + admin sin API mientras se define el backend. Cambiar el seed re-siembran los datos (ediciones locales del navegador se pierden).

## 2026-09-14 — Grillas de producto 4 por fila en desktop

- Motivo: densidad de catálogo. `grid-cols-2` móvil → `lg:grid-cols-4`; `sizes` de `ProductCard` en 25vw desde 1024px.

## 2026-09-14 — `FEATURED_PRODUCTS_COUNT = 8` (límite admin + home)

- Motivo: 2 filas completas de destacados en la home; el mismo valor limita cuántos productos se pueden marcar destacados.

## 2026-09-14 — Foto de categoría: admin → primer producto → fallback

- Motivo: control editorial sin obligar a cargar foto; categorías sin productos se ocultan.

## 2026-09-14 — Sin `parentId`: categorías planas ordenadas por `order`

- Motivo: no existe jerarquía de categorías; el campo no se usaba en ningún lado y confundía.

## 2026-09-14 — Postgres 16 en Docker Compose (raíz) + Prisma v6 + auth cookies JWT

- Motivo: base del backend real (backlog §8). PG16 pinneado (`postgres:16-alpine`, volumen `pgdata`, `healthcheck pg_isready`), compose en raíz porque lo comparten api y futuros servicios. Prisma v6 estable (evita el breaking `prisma.config.ts`/generador `prisma-client` de v7). Auth con cookies httpOnly + JWT por seguridad en browser. `.env` real siempre gitignored, solo `.env.example` se commitea.

## 2026-09-14 — API: módulos por feature + repositorios + pipes/guards globales

- Motivo: fundaciones Fase 2. `PrismaModule` global con repositorios por feature (servicios nunca tocan `PrismaClient` directo) por testabilidad. `ValidationPipe({whitelist, transform})` + `ThrottlerGuard` (100/min) globales por seguridad; `/health` exento de rate-limit para monitoreo. Validación de entorno con zod (falla rápido al arrancar). Logger pino estructurado desde el inicio.

## 2026-09-14 — API: bcryptjs + líneas CJS de config/jwt + `JwtModule` global

- Motivo: incidentes Fase 3. `bcryptjs` puro-JS (sin compilación nativa en Windows) con costo 12. `@nestjs/config@12`/`@nestjs/jwt@12` son ESM-only y rompen ts-jest CJS: pinneados a `config@^4`/`jwt@^11` (ambos soportan Nest 11). `JwtModule` global porque los guards se instancian en el módulo de cada controller. Email siempre en minúsculas (unicidad case-insensitive sin extensión `citext`).

## 2026-09-14 — API: `@nestjs/schedule@^5` + aprobación sin movimiento + kardex sin FKs

- Motivo: incidentes Fase 5. `schedule@12` también es ESM-only: pinneado a `^5` (CJS, soporta Nest 11); worker de expiración cada 15min + trigger manual. Aprobar el pago NO crea movimiento (la `reservation` ya descontó; paridad frontend, evita doble conteo). Kardex/auditoría sin FKs a producto para no borrar historia. Cupón: unique (coupon+user)/(coupon+email) + `usedCount` acotado en tx.

## 2026-09-14 — MP por REST directo + corte web con flag + `costPrice` no público

- Motivo: Fase 7. Sin SDK de MP (menos superficie ESM, flujo auditable con fetch nativo); webhook firmado HMAC idempotente por `mpPaymentId`, único que aprueba online (reemplaza al simulador cuando haya token; sin token hay modo mock + 503). La web migra tras `NEXT_PUBLIC_API_URL` (auth real, catálogo/blog lectura, checkout, pedidos; admin sigue local): sin la variable todo sigue mock, corte sin break. `costPrice` se oculta en lecturas públicas (dato interno B-06). Backups con `pg_dump` a `backups/` gitignored.
