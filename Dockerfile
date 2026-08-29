# Stage 1: Build everything from source
FROM node:20-slim AS builder

# Railway injects NODE_ENV=production into builds, which makes npm skip
# devDependencies — but the builder NEEDS them (vite, typescript). Force dev.
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --include=dev

COPY . .
RUN npm run build

# Stage 2: Production runtime
FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/dist ./dist
COPY --from=builder /build/api ./api
COPY --from=builder /build/db ./db
COPY --from=builder /build/server.ts ./server.ts
COPY --from=builder /build/package.json ./package.json
COPY --from=builder /build/package-lock.json ./package-lock.json
# tsconfig.json: tsx reads compiler options (jsx/target) from it at runtime
COPY --from=builder /build/tsconfig.json ./tsconfig.json

RUN npm ci --legacy-peer-deps --omit=dev

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "--import", "tsx", "server.ts"]
