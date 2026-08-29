# Stage 1: Build everything from source
FROM node:20-slim AS builder

# Railway auto-adds NODE_ENV=production to service variables and injects it into
# builds; npm then skips devDependencies in ways --include=dev doesn't reliably
# override across npm versions. So the build-critical toolchain (vite, tailwind,
# postcss...) lives in dependencies — install works under ANY npm config.
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
# Fail fast with a clear error if the toolchain is missing
RUN test -x node_modules/.bin/vite || (echo "FATAL: vite not installed" && exit 1)

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
