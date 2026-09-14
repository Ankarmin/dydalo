# DYDALO — AGENTS.md

Ecommerce streetwear peruano (tienda pública + admin interno). Monorepo `pnpm + turbo`, Node >=20.

## Estructura

- `apps/web/` — Next.js 16.2 + React 19 + Tailwind v4. Tienda + admin con stores en `localStorage` (sin backend). Ver `apps/web/AGENTS.md`.
- `apps/api/` — NestJS scaffold virgen (sin endpoints). Ver `apps/api/AGENTS.md`.
- `packages/eslint-config|typescript-config` — configs compartidas.
- `docs/business-context.md` — negocio y roles. `docs/functional-backlog.md` — backlog B-01 a K-01.
- `docs/arquitectura.md` — mapa del sistema. `docs/decisiones.md` — decisiones vigentes. `docs/SESION.md` — estado última sesión (leer al retomar).

## Comandos (desde raíz)

- `turbo run dev|build|lint|check-types --filter=@apps/web` (o `pnpm --filter @apps/web dev|build|lint|check-types`).
- API: `pnpm --filter api <script>` (scaffold, sin dev estable aún).

## Reglas globales

- Commits en español con la skill `conventional-commits` (`feat/fix/refactor/chore/docs`).
- No commitear `.next/`, `dist/`, `*.tsbuildinfo`, `.env*` (solo `.env.example`).
- Verificar antes de cerrar: `lint + check-types` de web si se tocó `apps/web/`.
- Tareas chicas y enfocadas; `@explore` para búsquedas amplias, no leer 100+ archivos en el hilo principal.

## Memoria entre sesiones

- Al retomar: leer `docs/SESION.md` + `git log --oneline -10` + `git status --short`. También existe `/retomar`.
- Al cerrar un tema o con `/guardar-contexto`: actualizar `docs/SESION.md` (objetivo, hecho con `ruta:línea`, pendiente, próximo paso). Corto, sin pegar código.
- Decisiones nuevas que cambien arquitectura → `docs/decisiones.md`, no solo al chat.
