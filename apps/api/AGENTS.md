# apps/api — AGENTS.md

NestJS 11 + Prisma v6 + Postgres 16 en Docker (`dydalo-postgres`, `docker-compose.yml` en raíz). Fundaciones listas (Fase 2): config validada, `PrismaModule` global, `GET /health`, `ValidationPipe` global, CORS solo web, throttler, pino. Auth + users + addresses (Fase 3). Catálogo + blog + config + auditoría (Fase 4). Ventas transaccionales (Fase 5). Logística/postventa (Fase 6). La web no lo consume aún: todo el estado vive en `localStorage` del frontend.

## Antes de andamiar (sesión backend)

- Verificar versiones y APIs vigentes de NestJS/Prisma/PostgreSQL contra documentación oficial (vía Context7 en la sesión de implementación) antes de decidir sintaxis o patrones. No hay MCP configurado en el repo: es consulta ad-hoc del entorno.
- Rumbo decidido (`docs/functional-backlog.md` §8): Prisma + PostgreSQL, auth server-side + hashing, transacciones de stock, webhooks MP firmados, migración de los stores. Roles solo `admin/customer`; SUNAT solo `billingType, ruc, razonSocial` nullable.

## Comandos

- `pnpm --filter api <script>` (tests: `test` unit con jest, `test:e2e` con supertest + DB local levantada).
- DB local (Postgres 16, contenedor `dydalo-postgres`): `db:up` (levanta), `db:down`, `db:logs`, `db:psql` (`SELECT version()`), `db:backup` (pg_dump a `backups/`, gitignored).
- Conexión: `DATABASE_URL` en `apps/api/.env` (gitignored; contrato en `.env.example`). Puertos: web `3000` / api `3001` / db `5432`.
- Prisma v6: schema en `apps/api/prisma/schema.prisma` (`prisma-client-js`, `url = env(...)`); `prisma:generate|migrate:dev|studio|seed`. Migraciones: `migrate dev` en local, `migrate deploy` en prod (nunca `db push` fuera de prototipo).
- Convención: módulos por feature; servicios vía repositorios que inyectan `PrismaService` (no `PrismaClient` directo). DTOs con `class-validator` (el pipe global ya valida/transforma).
- Ojo (cazados en Fase 3): DTOs en `@Body()` con `import type` NO se validan (metadata borrada) — usar import normal. `prisma generate --no-engine` deja un cliente que exige URLs `prisma://` (P6001) — no usar en dev. Regenerar el cliente con el dev de la API apagado (el DLL queda bloqueado: EPERM). `@nestjs/config|jwt` pinneados a línea CJS (`^4`/`^11`): las v12 son ESM-only y rompen ts-jest.
- Ojo (Fase 4): vale también para `@Query()` (sin metadata no hay transform: `'true'` string llega a Prisma). Prisma `Json` no acepta instancias de clase ni `unknown` — mapear a objetos planos (ver `AuditService.log` round-trip). Dinero en `Float` (paridad frontend; `Decimal` queda como migración futura). Seed importa `@/` del frontend (solo `prisma/`; `src/` nunca). `product.stock` es agregado recalculado; la verdad es `ProductVariant.stock`.
- Ojo (Fase 5): `@nestjs/schedule` también pinneado a CJS (`^5`; la v12 es ESM-only). Stock: `updateMany` con `stock: { gte: qty }` + `count` (nunca leer-y-luego-escribir). Repositorios con `tx` nunca usan `$transaction` dentro (anidado prohibido: lecturas compuestas solo fuera de tx). Tests e2e en paralelo: prefijos únicos por suite (`e2e-`, `f5-`, `cat-e2e+`, `sales-e2e+`). Aprobación de pago = auditoría, sin movimiento (la reserva ya descontó).
- Ojo (Fase 6): códigos `OC-###`/`RMA-###` con reintento ante colisión (unique). RMA exige `variantId` como el frontend. `PurchaseLine.variantId?` dirige la recepción (si no, reparto floor+resto). Devolución total cierra el pedido a `devuelto` vía rma + merma neteada; parcial deja `damage` informativo (`change: 0`). Tests e2e logistics usan `f6-`/`F6`/`logistics-e2e+`.
- Ojo (Fase 7): MP por REST directo (sin SDK: fetch nativo). Firma webhook = manifest `id:{data.id};request-id:{rid};ts:{ts};` + HMAC-SHA256 (ver `mp-signature.ts` + vector fijo en `mp.spec.ts`). Env seteado DENTRO de un spec llega tarde (ConfigModule valida al importar AppModule): overrides de env para e2e van en `test/setup-e2e.ts`. `costPrice` se oculta en lecturas públicas. `FRONTEND_URL(S)` para CORS/back_urls; `API_PUBLIC_URL` para `notification_url`; JWT placeholder revienta el boot en prod.
