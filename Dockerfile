FROM node:20-slim

WORKDIR /app

# Install all deps (includes tsx for running server, vite already not needed since dist/ is pre-built)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy pre-built frontend + API source
COPY dist ./dist
COPY api ./api
COPY db ./db
COPY server.ts ./

EXPOSE 3001

CMD ["npx", "tsx", "server.ts"]
