# Stage 1: Build frontend + backend
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y git python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /build
RUN git clone --depth 1 https://github.com/isaacbullockk/Omega-swarm.git /build

# Install ALL deps (including dev deps for build)
RUN npm install --legacy-peer-deps

# Build the frontend (creates fresh dist/)
RUN npm run build

# Stage 2: Production runtime
FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy built frontend
COPY --from=builder /build/dist ./dist

# Copy backend source
COPY --from=builder /build/api ./api
COPY --from=builder /build/db ./db
COPY --from=builder /build/server.ts ./server.ts
COPY --from=builder /build/package.json ./package.json
COPY --from=builder /build/tsconfig.json ./tsconfig.json

# Install only production deps
RUN npm install --legacy-peer-deps --omit=dev

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["node", "--import", "tsx", "server.ts"]
