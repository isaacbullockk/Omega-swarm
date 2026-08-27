# Stage 1: Build everything from source
FROM node:20-slim AS builder

WORKDIR /build

# Install ALL deps first (better layer caching)
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy full source and build frontend
COPY . .
RUN npm run build

# Stage 2: Production runtime
FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Fresh-built frontend
COPY --from=builder /build/dist ./dist

# Backend source
COPY --from=builder /build/api ./api
COPY --from=builder /build/db ./db
COPY --from=builder /build/server.ts ./server.ts
COPY --from=builder /build/package.json ./package.json
COPY --from=builder /build/tsconfig.json ./tsconfig.json

RUN npm install --legacy-peer-deps --omit=dev

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["node", "--import", "tsx", "server.ts"]
