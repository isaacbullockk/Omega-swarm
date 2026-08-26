# Production Dockerfile — dist/ is pre-built and committed
# No build step needed in Railway

FROM node:20-slim
ARG CACHE_BUST=2026-08-26-006
WORKDIR /app

# Install runtime utilities
RUN apt-get update && apt-get install -y dumb-init curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r omegaswarm && useradd -r -g omegaswarm omegaswarm

# Cache bust layer — always invalidate on build
RUN echo "Cache bust: $CACHE_BUST"

# Copy pre-built frontend + backend code
COPY dist ./dist
COPY api ./api
COPY db ./db
COPY server.ts ./
COPY package.json ./
COPY package-lock.json ./

# Install ONLY production dependencies
RUN rm -f package-lock.json && npm install --legacy-peer-deps --omit=dev

# Fix ownership
RUN chown -R omegaswarm:omegaswarm /app
USER omegaswarm

EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Graceful shutdown
ENTRYPOINT ["dumb-init", "--"]
CMD ["npx", "tsx", "server.ts"]
