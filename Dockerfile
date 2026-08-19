# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# 1. Install dependencies (cached independently of source changes)
# ---------------------------------------------------------------------------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# 2. Build the client bundle
#
# Vite inlines VITE_* variables at build time, so they are build args rather
# than runtime env. Server-only secrets stay out of this stage entirely.
# ---------------------------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_NAME
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_APP_NAME=$VITE_APP_NAME

RUN npm run build && npm run build:server

# ---------------------------------------------------------------------------
# 3. Runtime: static files plus the generation endpoint from one Node process
# ---------------------------------------------------------------------------
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080

# Production dependencies only. The server ships as a pre-bundled ESM file, so
# no TypeScript toolchain is present at run time.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server

# Never run as root.
USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist-server/index.js"]
