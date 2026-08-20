# Multi-stage production build for Railway
# Cache-busting: RUN command changed from previous build to force fresh npm install

# Stage 1: Builder — install deps + build frontend
FROM node:20-slim AS builder
WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests FIRST (for layer caching)
COPY package.json package-lock.json ./

# Install ALL dependencies (including dev deps for build)
# COMMAND CHANGED from "npm ci --legacy-peer-deps" to bust stale Railway cache
RUN npm ci --legacy-peer-deps && npm ls --depth=0 | grep -q vite && echo "vite confirmed installed"

# Copy source and build
COPY . .
RUN npx vite build

# Stage 2: Production — runtime only
FROM node:20-slim AS production
WORKDIR /app

# Install runtime utilities
RUN apt-get update && apt-get install -y dumb-init curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r omegaswarm && useradd -r -g omegaswarm omegaswarm

# Copy built frontend + backend code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/api ./api
COPY --from=builder /app/db ./db
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules

# Fix ownership
RUN chown -R omegaswarm:omegaswarm /app
USER omegaswarm

EXPOSE 3001

# Healthcheck for Railway
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Graceful shutdown with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["npx", "tsx", "server.ts"]
