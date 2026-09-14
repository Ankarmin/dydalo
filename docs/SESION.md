# SESION — estado entre sesiones

## 2026-09-14 — Fase 7b: MP sandbox en vivo (commiteado; falta solo el pago manual)

- Objetivo: probar la integración MP contra sandbox real (credenciales de prueba del usuario) + endpoint de sincronización.
- Hecho (código):
  - `MP_SANDBOX` en env (`APP_USR-` de prueba también lo necesita; el prefijo `TEST-` no basta) + `.env.example`.
  - `POST /orders/:id/mp-sync` (dueño/admin): busca el último pago por `external_reference` y lo aplica (idempotente); la web lo dispara al volver con `?mp=success`.
  - `buildPreferenceBody` solo manda `auto_return` con URLs https.
  - Tests: unit de ramas sin token (mock/503) + e2e de sync con fetch mockeado; setup-e2e con token falso.
- Hecho (vivo, token de prueba SOLO en `apps/api/.env` gitignored, MP_SANDBOX=true):
  - Preferencia real creada: `3689326986-5fe30abd-...`, `sandbox_init_point` sandbox.mercadopago.com.pe, `sandbox:true`.
  - `mp-sync` contra API real: `no-payments` (sin crash).
  - Pedido de prueba: orden `cmu0vod7r…` (usuario `f7live@test.com`, S/168.3, pendiente, 1 unidad reservada). Servidor API dejado CORRIENDO para la prueba de pago.
- Hallazgos MP (verificados contra API real):
  - `auto_return: approved` + back_urls localhost → 400 `invalid_auto_return` (por eso el flag https).
  - `POST /v1/payments` directo con estas credenciales → 401 `Unauthorized use of live credentials`: el cobro server-side no aplica; el camino soportado es Checkout Pro hospedado (preferencia + pago en MP).
  - Tarjetas de prueba PE (docs oficiales): Mastercard 5031…0604 / Visa 4009…6176, cvv 123, vto 11/30, titular APRO + doc 123456789 = aprobado.
- Pendiente (paso manual del usuario, cuando quiera): pagar en el link sandbox como comprador de prueba → avisar → correr `mp-sync` y verificar `aprobado` + idempotencia. Sin túnel el webhook de MP no llega (normal); el sync lo cubre.
- Datos para retomar: orden `cmu0vod7r0001uy6o9hmj3lci`, preferencia `3689326986-5fe30abd-4f42-4165-9de6-4f4f50b2e450`, link `https://sandbox.mercadopago.com.pe/checkout/v1/redirect?pref_id=3689326986-5fe30abd-4f42-4165-9de6-4f4f50b2e450`. Para retomar: `db:up` + `pnpm --filter api dev` (el token test sigue en `.env` local, gitignored, nunca commiteado).
- Verificado al cierre: e2e 44/44 + unit 14/14; `lint` + `check-types` api verdes; web `check-types` + `lint` (0 errores, 1 warning preexistente) + `build` OK. Commits atómicos pusheados a `origin/main`.
- Próximo paso: pago manual + sync; luego rotar credenciales de prueba, limpiar pedido `cmu0vod7r…` y migrar el admin a la API.

## 2026-09-14 — Fase 7 backend+web: integración lectura-primero + MP real + hardening (commiteado)

- Objetivo: la web consume el backend tras `NEXT_PUBLIC_API_URL` (sin la variable todo sigue mock) + Checkout Pro real con webhook firmado.
- Hecho:
  - API `src/mp/`: `mp-signature.ts` (HMAC-SHA256 `id;request-id;ts`, timing-safe, 401), `mp-mapper.ts` (9 estados MP→internos, `binary_mode: false`, `PEN`, back_urls a pedido-confirmado), `MpService` (preferencia por REST directo sin SDK + `GET payment` + webhook idempotente por `mpPaymentId`, actor `sistema_mp`; sin token: mock + 503), `MpController` (`POST /orders/:id/mp-preference` dueño/admin, `POST /payments/webhook` público con throttle 30/min + `GET` de verificación).
  - API misc: `GET /orders/:id/attempts` (propios); `costPrice` oculto en `GET /products*` públicos; CORS por `FRONTEND_URL(S)`; JWT placeholder revienta boot en prod; `PaymentsService.findAttemptByMpPaymentId`; `db:backup` (pg_dump a `backups/` gitignored, verificado 125KB).
  - Web `src/lib/api/` (`client.ts` con `ApiError` + cookies, `catalog.ts` con mappers a tipos frontend, `orders.ts`); `.env.example` con `NEXT_PUBLIC_API_URL`.
  - Web auth real (`auth-context`: login/register/me/logout/perfil/password contra API, misma interfaz, mock intacto sin flag).
  - Web lectura: hooks `use-products|categories|blog|site-config` revalidan contra API (fallback local); `producto/[slug]` y `catalogo/[slug]` server con fallback.
  - Web compra: checkout crea pedido vía API (resuelve ids por slug) + preferencia MP (redirige a `initPoint`, mock confirma como hoy); cupón vía `/coupons/validate`; `cuenta/pedidos` lista/reintenta/devuelve vía API; `pedido-confirmado` y `reintentar` con vía API (MP real) y mock intacto.
- Incidentes: `@Query('data.id')` llega undefined (Express lo anida: leer `query['data.id'] ?? query.data.id`); env seteado DENTRO de un spec llega tarde (ConfigModule valida al importar AppModule): overrides e2e van en `test/setup-e2e.ts` (nuevo, con `setupFiles`); `window.location.href=` lo prohíbe el lint (usar `.assign`); lint `category-form` y warning `notFound` son preexistentes en HEAD (verificado con stash; al de category-form se le puso disable justificado).
- Pendiente: commit del bloque (todo SIN commit aún, F1–F7).
- Verificado: api e2e 41/41 (6 suites, incl. `mp.e2e` 5/5) + unit 10/10; `lint` + `check-types` api verdes; web `check-types` + `lint` (0 errores) + `build` OK (136 páginas); smoke vivo register→me→products→order(249)→preference mock→attempts; DB sin restos (solo seed + admins).
- Próximo paso: commit por fases; luego migrar admin a la API y `migrate deploy` + MP con token real en staging.

## 2026-09-14 — Fase 6 backend: logística y postventa (SIN commit)

- Objetivo: shipments con máquina por fulfillment, proveedores, OC con recepción y RMA completo, todo atómico y auditado.
- Hecho:
  - `prisma/schema.prisma`: enums `PurchaseStatus|ReturnStatus|ReturnReason|ReturnOrigin`; `Supplier` (baja lógica), `PurchaseOrder` (+`PurchaseLine` con `variantId?`, `code` único), `ShipmentEvent` (FK pedido), `ReturnRequest` (+`ReturnItem`, `code` único); migraciones `logistics-postventa` + `purchase-line-variant`.
  - `src/shipments/`: `POST /admin/orders/:id/shipment` (máquina `SHIPMENT_TRANSITIONS` por tipo + guía Olva/evidencia App/DNI Recojo) + evento + auditoría en 1 tx; `GET /orders/:id/shipment` (tracking cliente propio) y timeline admin.
  - `src/suppliers/`: CRUD admin sin borrado (baja con `active:false`).
  - `src/purchases/`: `POST /admin/purchases` (código `OC-###` con reintento, valida proveedor/producto), `POST :id/receive` (capa por pendiente, parcial/total, reparte floor+resto o a variante forzada, movimientos `purchase`, `costPrice`=último costo, auditorías), `PATCH :id/cancel`.
  - `src/returns/`: `POST /returns` (web: SLA 7 días desde entrega, anti-doble-devolución) + admin (nace aprobada); `PATCH :id/status` (máquina), `POST :id/receive|inspect` (restock+damage=recibido, reingreso con `return`), `POST :id/close` (todo devuelto→pedido `devuelto` vía rma + `damage` neteado o informativo + reembolso con intento `reembolsado`), todo en tx.
  - Tests: `test/logistics.e2e-spec.ts` (8 casos: OC parcial/total con reparto exacto, las 3 máquinas de envío con sus guardias, RMA total/parcial/guardias, lista admin); total e2e 36/36 (5 suites); unit 4/4.
- Incidentes: `Order` necesitó back-relations (`shipments`, `returns`); `PurchaseLine.variantId` nació en 2ª migración (primero viajaba fuera de la línea: frágil); RMA exige `variantId` como el frontend (el e2e lo omitía → 400 correcto); OC responde la orden directa (el test leía `.order`); suites en paralelo: logistics usa prefijos `f6-`/`F6`/`logistics-e2e+`.
- Pendiente: commit del bloque (todo SIN commit aún).
- Verificado: `migrate dev` OK (2 migraciones); e2e 36/36; unit 4/4; `lint` + `check-types` api verdes (0 errores, 0 warnings); DB sin restos e2e (0 RMA/OC/proveedores/pedidos/usuarios de test).
- Próximo paso: Fase 7 (integración web lectura-primero + MP real + hardening).

## 2026-09-14 — Fase 5 backend: núcleo transaccional (SIN commit)

- Objetivo: pedidos con reserva de stock, pagos con 11 estados, cupones de un uso y kardex real, todo atómico.
- Hecho:
  - `prisma/schema.prisma`: enums `OrderStatus|OrderOrigin|PaymentStatus|FulfillmentType|ShipmentStatus|CouponType|StockMovementType`; `Coupon` + `CouponRedemption` (unique coupon+user y coupon+email), `Order` (+`OrderItem` con foto `unitCost`, snapshot de dirección, `statusHistory`), `PaymentAttempt` (unique order+`attemptNumber`), `StockMovement` (sin FKs: histórico con snapshots); migración `sales-coupons-orders-payments-kardex`.
  - `src/coupons/`: CRUD admin (código UPPER único, PERCENT≤100, no borra con usos) + `POST /coupons/validate` (dice descuento sin registrar uso); `registerUse` en tx con guardias unique + `usedCount` acotado.
  - `src/orders/`: `POST /orders` (checkout: precios desde DB, cupón revalidado, envío por fulfillment, decremento con guardia `stock >= qty`, intento `pendiente`, movimientos `reservation`, TTL 24h/48h, todo en 1 tx), `GET /orders[/:id]`, `PATCH /:id/cancel` (solo pendiente), `POST /:id/retry` (no duplica); admin `POST /admin/orders` (manual), `GET` (filtros+detalle con intentos/movimientos/auditoría), `PATCH :id/status` (`VALID_TRANSITIONS`, `devuelto` solo vía rma, restaura stock), `PATCH :id/payment` (motivo/evidencia obligatorios), `POST :id/payment/simulate-webhook` (mapeo MP, idempotente por `mpPaymentId`, actor `sistema_mp`), `GET /admin/payments/alerts` (>24h revisión, >2h rechazo), `POST /admin/reservations/expire-run` + worker `@Cron` 15min (idempotente, actor `sistema`).
  - `src/inventory/`: `POST /admin/inventory/adjust` (motivo mín 5, bloqueo negativo, `manual_adjustment|damage`) + kardex por producto/variante/pedido.
  - Aprobación = solo auditoría (la reserva ya descontó; paridad frontend). `AuditService.log` y `recalcStock` aceptan `tx`.
  - Tests: `test/sales.e2e-spec.ts` (11 casos: cupón doble uso 400, sobreventa 409, carrera concurrente 1×201+1×409, reintento, webhook+idempotencia, motivo/evidencia, expiración+restaura+idempotencia, transiciones, kardex, detalle+alertas); total e2e 28/28 (4 suites); unit 4/4.
- Incidentes: `updateMany` sin `stock >= qty` habría sobrevendido (el test concurrente lo exige); `POST` Nest responde 201 por defecto (`/coupons/validate` necesitó `@HttpCode(200)`); suites e2e en paralelo se pisaban (prefijos `e2e-` compartidos: sales usa `f5-`/`F5`/`sales-e2e+`); `JwtModule` ya era global (bien); `@nestjs/schedule@12` también es ESM-only → pinneado a `^5` (CJS, soporta Nest 11).
- Pendiente: commit del bloque (todo SIN commit aún).
- Verificado: `migrate dev` OK; e2e 28/28; unit 4/4; `lint` + `check-types` api verdes (0 errores, 0 warnings); DB sin restos e2e (0 pedidos/cupones/usuarios de test).
- Próximo paso: Fase 6 (logística/postventa: shipments, suppliers, purchases/OC, returns RMA).

## 2026-09-14 — Fase 4 backend: catálogo + blog + config + auditoría (SIN commit)

- Objetivo: lectura pública del catálogo (base de la migración web lectura-primero) + CRUD admin con auditoría + seed espejo del frontend.
- Hecho:
  - `prisma/schema.prisma`: `Category`, `Product` (FK categoría `Restrict`, `images String[]`, `colors` Json, `stock` agregado, `sku` único), `ProductVariant` (`key` estable = id frontend, unique `(productId,size,color)`, `sku` único), `BlogPost` (autor snapshot sin FK), `SiteConfig` (singleton `default`), `AuditLog` (append-only + índices); migración `catalog-blog-config-audit` aplicada.
  - Públicos: `GET /categories`, `GET /products` (filtros categoría/búsqueda/destacados, orden newest|price|name, paginado, solo activos), `GET /products/:slug`, `GET /blog[/:slug]` (solo publicados), `GET /site-config`.
  - Admin (`@Roles('admin')`): CRUD `/admin/categories` (+ `PATCH order` bulk) con 409 si tiene productos; CRUD `/admin/products` (slug auto-único, sku único, límite 8 destacados, slug inmutable) + variantes (alta y edición SIN `stock`: lo mueve Fase 5); CRUD `/admin/blog` (nace borrador, publicar/despublicar, no borra publicado); `PATCH /admin/site-config` (merge por clave); `GET /admin/audit` (filtros + paginado, solo lectura).
  - `AuditModule` global (`log` + `list` + `diffObjects`); JWT ahora lleva `name` (display) para `createdByName` sin query extra.
  - `prisma/seed-catalog.ts`: importa `products`+`catalogCategories`+`configStore.get()` del frontend vía `@/` (solo seed; `src/` nunca lo usa); upsert por slug, variantes estables, costos demo por id, `stock` recalculado; `seed.ts` lo invoca. Seed: 8 categorías, 80 productos, 549 variantes, 3 posts, config.
  - Tests: `test/catalog.e2e-spec.ts` (8 casos incl. límite de destacados llenando hasta 8, stock agregado 10→15→12, stock inmutable por PATCH, 409 categoría con productos, auditoría con nombre Diego); total e2e 17/17; unit 4/4.
- Incidentes: `updateVariant` nació sin `recalcStock` (el e2e lo cazó: 15 en vez de 12); `import type` del DTO en el controller público anuló transform/validación (query `featured=true` llegó string a Prisma → 500); Prisma Json rechaza instancias de clase (colores del DTO y `changes` con `unknown`): objetos planos + round-trip JSON en `AuditService.log`.
- Pendiente: commit del bloque (todo SIN commit aún).
- Verificado: `migrate dev` OK; `db seed` OK; e2e 17/17; unit 4/4; `lint` + `check-types` api verdes (0 errores, 0 warnings); DB sin restos e2e (`e2e-%` = 0). Deuda anotada: dinero en `Float` (paridad con el frontend; pasar a `Decimal` es migración dedicada futura).
- Próximo paso: Fase 5 (núcleo transaccional: cupones, pedidos, pagos, kardex, reserva TTL + worker).

## 2026-09-14 — Fase 3 backend: auth cookies JWT + users + addresses (SIN commit)

- Objetivo: identidad server-side (sustituto del `auth-context` mock) + primera migración real.
- Hecho:
  - `prisma/schema.prisma`: `UserRole(admin|customer)`, `User` (email único normalizado en minúsculas, `passwordHash` bcrypt, `lastLoginAt`) + `Address` (default por usuario en tx de app); migración `auth-users-addresses` aplicada.
  - `src/auth/`: register (siempre customer)/login/logout/me con cookie `access_token` httpOnly + `SameSite=Lax`, `JwtAuthGuard` (lee cookie, no Bearer), `RolesGuard` + `@Roles`, throttle 20/min en register/login, `JwtModule` global.
  - `src/users/`: repositorio (select público sin hash) + perfil/cambio de password; `src/addresses/`: CRUD propio por usuario + default única con herencia a la más antigua al borrar.
  - `prisma/seed.ts`: upsert idempotente `diego@`/`david@` como admin (`ADMIN_SEED_PASSWORD`, solo local).
  - Tests: `src/auth/guards/roles.guard.spec.ts` (unit) + `test/auth.e2e-spec.ts` (9 casos: registro/login/logout/cookies/addresses/default); `test/app.e2e-spec.ts` reutilizado a `GET /health` (el scaffold esperaba `Hello World!` de un controller inexistente).
  - Deps: `@nestjs/jwt@^11` + `@nestjs/config@^4` (ver motivo abajo), `bcryptjs` (+types).
- Incidentes y decisiones tomadas en el camino:
  - `prisma generate --no-engine` genera un cliente que exige URLs `prisma://` (P6001): prohibido para dev local; se regeneró completo. El DLL del engine lo bloquea el dev con la API levantada (EPERM): regenerar con el dev apagado.
  - `@nestjs/config@12` y `@nestjs/jwt@12` son ESM-only y rompen ts-jest CJS (hasta el e2e del scaffold): pinneados a línea CJS (`config@^4`, `jwt@^11`, ambos soportan Nest 11).
  - DTOs en `@Body()` con `import type` borran la metadata y el `ValidationPipe` NO valida (silencioso): DTOs siempre con import normal (el e2e lo cazó: email inválido pasaba con 201).
  - `JwtAuthGuard` con `JwtService` debe vivir donde haya `JwtModule`: se hizo global.
- Pendiente: commit del bloque (todo SIN commit aún).
- Verificado: `migrate dev` OK; `db seed` OK (2 admins); unit 4/4; e2e 9/9; `lint` + `check-types` api verdes (0 errores, 0 warnings); DB final solo `diego@`+`david@` (basura e2e limpiada). Nota: al cierre no corría ningún `dev` (el `nest --watch` quedó sin hijo en 3001 a mitad de fase); se dejó `dist/` reconstruido con `build`.
- Próximo paso: Fase 4 (catálogo: categorías, productos/variantes, blog, site_config + seed espejo).

## 2026-09-14 — Fase 2 backend: fundaciones API (SIN commit)

- Objetivo: API arranca con config validada, Prisma v6, `GET /health` real y CORS a la web.
- Hecho:
  - Deps api: `@prisma/client@^6`, `prisma@^6`, `@nestjs/config|throttler`, `class-validator|transformer`, `cookie-parser`, `nestjs-pino`, `pino`, `zod`; `pnpm-workspace.yaml` (`allowBuilds` Prisma).
  - `apps/api/prisma/schema.prisma` (nuevo, v6 `prisma-client-js`, sin modelos) + `prisma/seed.ts` (placeholder con `SELECT 1`).
  - `src/prisma/` (nuevo, módulo global + servicio con `$connect/$disconnect`), `src/config/env.validation.ts` (zod, falla rápido), `src/health/` (`GET /health` con `SELECT 1`, sin rate-limit).
  - `main.ts`: pino + `cookieParser()` + `ValidationPipe({whitelist, transform})` + CORS solo `localhost:3000` con credenciales. `AppModule`: `ConfigModule` global + `ThrottlerGuard` global (100/min) + pino.
  - `package.json`: scripts `prisma:generate|migrate:dev|studio|seed` + clave `prisma.seed`; `tsconfig.build.json` excluye `prisma/` (el `dist` queda plano: `dist/main`, el `start:prod` original estaba bien).
- Pendiente: commit del bloque (todo SIN commit aún).
- Verificado: `prisma validate` OK; `migrate dev` sin cambios (schema vacío, primera migración real en Fase 3); `generate` OK (6.19.3); `db seed` OK; `build` OK; `GET :3001/health → {status:ok, db:ok}` con headers CORS correctos; `check-types` + `lint` api verdes. Aviso: `package.json#prisma.seed` deprecado en futuro v7 (en v6 sigue vigente).
- Próximo paso: Fase 3 (auth cookies JWT + users + addresses).

## 2026-09-14 — Fase 1 backend: Postgres 16 dockerizado (SIN commit)

- Objetivo: base de datos local del backend real sin tocar la web.
- Hecho:
  - `docker-compose.yml` (raíz, nuevo): servicio `db` `postgres:16-alpine`, contenedor `dydalo-postgres`, `5432`, volumen `pgdata`, `healthcheck pg_isready`.
  - `apps/api/.env.example` (nuevo) + `apps/api/.env` (local, gitignored): `DATABASE_URL`, `PORT=3001`, placeholders `JWT_*`/`MP_*`.
  - `apps/api/package.json`: scripts `db:up|down|logs|psql`.
  - Docs: `docs/decisiones.md` (PG16 + Prisma v6 + cookies JWT), `docs/arquitectura.md` (sección api + puertos), `apps/api/AGENTS.md` (comandos DB).
  - `.gitignore` ya cubría `.env` (sin cambios).
- Pendiente: commit del bloque (junto a memoria + home, todo SIN commit aún).
- Verificado: `docker compose up -d db` levanta `dydalo-postgres` (PG 16.15, `pg_isready` OK, `SELECT version()` OK); `pnpm --filter api check-types` verde; `apps/api/.env` ignorado por git (`.gitignore:9`). Nota: hubo que iniciar Docker Desktop manualmente (el daemon estaba apagado).
- Próximo paso: Fase 2 (Prisma v6 + `ConfigModule` + `/health`).

## 2026-09-14 — Contexto de negocio refrescado para sesión backend (SIN commit)

- Objetivo: dejar el contexto listo para construir el backend en una sesión nueva.
- Hecho:
  - `docs/business-context.md`: fecha a 2026-09-14; estado real (auditoría, kardex, costo/proveedor, fulfillment triple, cupones, RMA, compras existen; pagos mock; SEO y backend pendientes); responsabilidades de Diego con pagos manuales, fulfillment, OC y RMA; riesgos solo con lo vigente; prioridad (backend → pagos reales → SEO).
  - `apps/api/AGENTS.md`: regla de verificar NestJS/Prisma/Postgres en docs oficiales vía Context7 + rumbo decidido (backlog §8). Verificado: Context7 no estaba integrado en fogoneria-system (fue uso ad-hoc, el sistema no depende de ello).
- Pendiente: verificación visual del bloque anterior y commit conjunto.
- Próximo paso: sesión backend (schema Prisma desde `data-store.types.ts`, auth server-side, migración de stores).

## 2026-09-14 — Autocontexto del agente + home con categorías y grillas 4/fila (SIN commit)

- Objetivo: montar el sistema de memoria del agente (réplica de fogoneria-system) y cerrar los temas de home/categorías.
- Hecho:
  - Memoria: `AGENTS.md` raíz + `apps/web/AGENTS.md` + `apps/api/AGENTS.md`, `opencode.json`, `.opencode/commands/guardar-contexto.md|retomar.md`, `docs/arquitectura.md|decisiones.md|SESION.md`.
  - Home: `home-categories.tsx` (nuevo, foto admin → primer producto → fallback) montado tras el hero (`(home)/page.tsx`); grillas a `lg:grid-cols-4` en `home-products.tsx`, `catalog-grouped.tsx`, `catalog-grid.tsx`, `related-products.tsx`, `favorites-page-client.tsx` + sus `loading.tsx`; `sizes` de `product-card.tsx` a 25vw desktop.
  - Destacados 6 → 8 (`constants.ts`) + `products.ts`: camisas 61 y tanks 71 a `featured: true`.
  - Admin categorías: columna Foto (`categorias-client.tsx`), borrado de foto guarda vacío + auditoría de `image/description` (`category-form.tsx`); eliminado `parentId` del form y del tipo (`data-store.types.ts`).
  - Verificado: `check-types` OK. Aviso de lint en `category-form.tsx` (setState en effect) es preexistente.
- Pendiente: verificación visual en `dev` (home 360/1024/1280px, foto categoría desde admin) y commit del bloque (15 modificados + 1 nuevo).
- Próximo paso: recorrido visual y commit.
