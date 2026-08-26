FROM node:20-slim
WORKDIR /app

RUN apt-get update && apt-get install -y curl git && rm -rf /var/lib/apt/lists/*

# NUCLEAR: Always fetch fresh code from GitHub main branch
# This bypasses Docker layer caching entirely
RUN echo "Fetching fresh code..." && \
    git clone --depth 1 https://github.com/isaacbullockk/Omega-swarm.git /tmp/repo && \
    cp -r /tmp/repo/api ./api && \
    cp -r /tmp/repo/db ./db && \
    cp -r /tmp/repo/dist ./dist && \
    cp /tmp/repo/server.ts ./server.ts && \
    cp /tmp/repo/package.json ./package.json && \
    rm -rf /tmp/repo && \
    echo "Code fetched at:" && date

RUN npm install --legacy-peer-deps --omit=dev

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["node", "--import", "tsx", "server.ts"]
