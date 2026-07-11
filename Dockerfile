FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN pnpm turbo build --filter=@baseagent/web --filter=@baseagent/api

# Flatten API deps for ESM resolution (pnpm symlinks don't survive COPY)
RUN mkdir -p /api-flat && \
    cp apps/api/dist/server.js /api-flat/server.js && \
    cp apps/api/dist/server.d.ts /api-flat/ 2>/dev/null || true && \
    cp apps/api/package.json /api-flat/package.json && \
    cd /api-flat && \
    npm init -y > /dev/null 2>&1 || true
# Copy real (not symlinked) node_modules for the API
RUN cp -rL apps/api/node_modules /api-flat/node_modules 2>/dev/null || true && \
    cp -rL node_modules/.pnpm /api-flat/node_modules/.pnpm 2>/dev/null || true
# Ensure top-level deps are available (pnpm hoists some to root)
RUN for pkg in fastify @fastify/cors @fastify/helmet @fastify/jwt @fastify/cookie @fastify/rate-limit @fastify/websocket dotenv drizzle-orm pg argon2 zod uuid ethers bullmq ioredis; do \
      if [ ! -d "/api-flat/node_modules/$pkg" ] && [ -d "/app/node_modules/.pnpm" ]; then \
        real=$(find /app/node_modules/.pnpm -maxdepth 3 -name "package.json" -path "*/$pkg/package.json" | head -1); \
        if [ -n "$real" ]; then \
          pkgdir=$(dirname "$real"); \
          mkdir -p "/api-flat/node_modules/$pkg"; \
          cp -r "$pkgdir"/* "/api-flat/node_modules/$pkg/"; \
        fi; \
      fi; \
    done
# Also copy @baseagent/shared
RUN mkdir -p /api-flat/node_modules/@baseagent && \
    cp -r /app/packages/shared /api-flat/node_modules/@baseagent/shared

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV API_PORT=3001
ENV API_HOST=0.0.0.0

# Next.js standalone
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# API server with flattened node_modules
COPY --from=builder /api-flat ./api

COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3000
CMD ["./start.sh"]
