FROM node:20-slim

# Force complete rebuild by changing WORKDIR
RUN mkdir -p /omega && rm -rf /app
WORKDIR /omega

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY dist ./dist
COPY api ./api
COPY db ./db
COPY server.ts ./
COPY package.json ./

RUN rm -rf node_modules package-lock.json && npm install --legacy-peer-deps --omit=dev

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["node", "--import", "tsx", "server.ts"]
