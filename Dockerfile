# syntax=docker/dockerfile:1.7

# ─────────────────────────────────────────────────────────────────────────────
# Imagen multi-stage para Angular 21 + SSR (Express).
# Stages:
#   - base         : Node alpine compartido
#   - development  : devDependencies + ng serve (con bind mount via compose)
#   - deps         : devDependencies para el build de producción
#   - builder      : ejecuta `npm run build` (genera dist/ con SSR)
#   - production   : runtime mínimo — sólo node + dist bundleado
# ─────────────────────────────────────────────────────────────────────────────

ARG NODE_VERSION=22.18.0

# ── Base ────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
ENV CI=true \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false


# ── Development (target del compose de dev) ─────────────────────────────────
FROM base AS development
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
# El código fuente entra por bind mount desde docker-compose.yml.
EXPOSE 4200
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--poll", "1000"]


# ── Deps (instala todas las dependencias para el build) ─────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci


# ── Builder (compila SSR; bundle self-contained vía esbuild) ────────────────
FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build


# ── Production (runtime mínimo, non-root, sólo dist) ────────────────────────
FROM node:${NODE_VERSION}-alpine AS production
ENV NODE_ENV=production \
    PORT=4000

# Sólo lo estrictamente necesario; sin npm, sin source maps, sin devDeps.
WORKDIR /app

# Copia únicamente el bundle de SSR (Angular esbuild ya inlinea Express y deps).
COPY --from=builder --chown=node:node \
     /app/dist/MISO-4104-ANGULAR-PRACTICE-ASSESSMENT \
     ./dist/MISO-4104-ANGULAR-PRACTICE-ASSESSMENT

USER node
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/MISO-4104-ANGULAR-PRACTICE-ASSESSMENT/server/server.mjs"]
