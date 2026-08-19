# ============================================================
# Omega Swarm — Production Dockerfile (Multi-Stage, Hardened)
# Version: 4.4.0-PROD
# ============================================================

# --- Stage 1: Dependencies (cached layer, no source code yet) ---
FROM node:20-slim AS deps
WORKDIR /app

# Install security updates and required build tools for native modules
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests FIRST for optimal layer caching
COPY package.json package-lock.json ./

# Install production-only deps (clean layer, no dev deps)
RUN npm ci --legacy-peer-deps --omit=dev && npm cache clean --force

# --- Stage 2: Builder (compile/check the app) ---
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy all source needed to build and run
COPY . .

# Verify dist/ exists; if not, build it. If source build is required, uncomment:
# RUN npm run build

# Verify critical files exist (fail fast at build time)
RUN test -f dist/index.html || (echo 'FATAL: dist/index.html missing. Run npm run build before docker build.' && exit 1)
RUN test -f server.ts || (echo 'FATAL: server.ts missing' && exit 1)

# --- Stage 3: Production Runtime (hardened, minimal attack surface) ---
FROM node:20-slim AS runner
WORKDIR /app

# Install dumb-init for proper signal forwarding (PID 1 problem fix)
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates dumb-init && rm -rf /var/lib/apt/lists/*

# Create non-root user/group for security
RUN groupadd -r omegaswarm -g 1001 && useradd -r -g omegaswarm -u 1001 -s /sbin/nologin -d /app omegaswarm

# Copy built frontend assets
COPY --from=builder --chown=omegaswarm:omegaswarm /app/dist ./dist

# Copy backend source (TypeScript, runs via tsx)
COPY --from=builder --chown=omegaswarm:omegaswarm /app/api ./api
COPY --from=builder --chown=omegaswarm:omegaswarm /app/db ./db
COPY --from=builder --chown=omegaswarm:omegaswarm /app/server.ts ./
COPY --from=builder --chown=omegaswarm:omegaswarm /app/tsconfig*.json ./

# Copy production node_modules from deps stage
COPY --from=deps --chown=omegaswarm:omegaswarm /app/node_modules ./node_modules
COPY --from=deps --chown=omegaswarm:omegaswarm /app/package.json ./

# Create data directory with proper ownership for persistent JSON store
RUN mkdir -p /app/data && chown -R omegaswarm:omegaswarm /app/data

# Switch to non-root user
USER omegaswarm

# Expose app port (Railway injects $PORT at runtime)
EXPOSE 3001

# Healthcheck — used by Docker, Railway, and load balancers
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3   CMD curl -sf http://localhost:${PORT:-3001}/api/health || exit 1

# Use dumb-init to properly handle SIGTERM/SIGINT for graceful shutdown
ENTRYPOINT [ "dumb-init", "--" ]

# Production command: tsx runs TypeScript directly without pre-compilation
CMD [ "npx", "tsx", "server.ts" ]
