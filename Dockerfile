FROM node:20-slim AS base

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files and install ALL deps (including devDeps for build)
COPY package.json package-lock.json* ./
ENV NODE_ENV=development
RUN npm install --legacy-peer-deps

# Copy ALL source files
COPY . .

# Build frontend fresh — this creates dist/ in the container
RUN npm run build

# Expose port
EXPOSE 3001

# Start server (serves freshly-built dist/ + API)
CMD ["npx", "tsx", "server.ts"]
