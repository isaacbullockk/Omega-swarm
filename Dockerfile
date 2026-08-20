# Production Dockerfile — Frontend pre-built, ship dist directly
# Vite is NOT needed in production. dist/ is pre-built and committed.

FROM node:20-slim AS production
WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y dumb-init curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r omegaswarm && useradd -r -g omegaswarm omegaswarm

# Copy pre-built frontend (dist/ is committed to git)
COPY dist ./dist

# Copy backend code
COPY api ./api
COPY db ./db
COPY server.ts ./
COPY package.json ./
COPY package-lock.json ./

# Install ONLY production dependencies (no vite, no typescript, no build tools)
RUN npm ci --legacy-peer-deps --omit=dev

# Fix ownership
RUN chown -R omegaswarm:omegaswarm /app
USER omegaswarm

EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Graceful shutdown with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["npx", "tsx", "server.ts"]
