# DYDALO API — imagen de despliegue (staging `test` / prod futuro).
# Multistage: builder compila Nest + genera Prisma; runner ejecuta
# `migrate deploy` y luego `node dist/main`. Contexto de build: RAÍZ del repo.
# Railway: auto-detecta este Dockerfile (root directory = apps/api -> cambiar a raíz).
# Vercel NO usa este archivo (solo despliega apps/web).

FROM node:24-slim AS builder

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@11.17.0 --activate
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Manifiestos + fuentes (el postinstall de Prisma necesita el schema presente)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api ./apps/api
COPY apps/web/package.json ./apps/web/package.json
COPY packages ./packages

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @apps/api prisma:generate
RUN pnpm --filter @apps/api build

# --- Runner: lo mínimo para migrar + servir ---
FROM node:24-slim AS runner

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Se mantiene el layout /app del builder: pnpm usa symlinks relativos
# y la resolución de módulos sube hasta /app/node_modules.
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/
COPY --from=builder /app/packages /app/packages
COPY --from=builder /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=builder /app/apps/api/dist /app/apps/api/dist
COPY --from=builder /app/apps/api/package.json /app/apps/api/package.json
COPY --from=builder /app/apps/api/prisma /app/apps/api/prisma

WORKDIR /app/apps/api

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||'3001')+'/health').then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"

# migrate deploy (prod-like, nunca `migrate dev`) y luego el servidor.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
