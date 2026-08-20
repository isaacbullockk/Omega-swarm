# Stage 1: Build Frontend + Backend Assets
FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ curl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
# Force fresh install + verify vite exists (fixes stale Docker cache)
RUN npm ci --legacy-peer-deps && ls node_modules/.bin/vite || npm install vite@latest --legacy-peer-deps
# Copy source and build
COPY . .
RUN npx vite build

# Stage 2: Production
FROM node:20-slim AS production
WORKDIR /app
RUN apt-get update && apt-get install -y dumb-init curl && rm -rf /var/lib/apt/lists/*
RUN groupadd -r omegaswarm && useradd -r -g omegaswarm omegaswarm

# Copy built assets and runtime code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/api ./api
COPY --from=builder /app/db ./db
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Fix ownership and run as non-root
RUN chown -R omegaswarm:omegaswarm /app
USER omegaswarm
EXPOSE 3001

# Healthcheck for Railway
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3   CMD curl -f http://localhost:3001/api/health || exit 1

# Graceful shutdown
ENTRYPOINT ["dumb-init", "--"]
CMD ["npx", "tsx", "server.ts"]
