FROM node:20-slim

WORKDIR /app

# Cache bust: force fresh COPY on every rebuild
ARG CACHE_BUST=2

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 3001

# Start the server
CMD ["npx", "tsx", "server.ts"]
