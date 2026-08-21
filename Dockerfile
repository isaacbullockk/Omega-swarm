# Multi-stage production build for Railway
# Build frontend inside Docker — dist/ is NOT in git

FROM node:20-slim AS builder
WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests and install deps
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npx vite build

# Production stage
FROM node:20-slim AS production
WORKDIR /app

RUN apt-get update && apt-get install -y dumb-init curl && rm -rf /var/lib/apt/lists/*
RUN groupadd -r omegaswarm && useradd -r -g omegaswarm omegaswarm

# Copy built assets + backend code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/api ./api
COPY --from=builder /app/db ./db
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules

RUN chown -R omegaswarm:omegaswarm /app
USER omegaswarm

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["npx", "tsx", "server.ts"]
