FROM node:20-alpine
WORKDIR /app

# Copy package files first (for layer caching)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest (node_modules excluded by .dockerignore)
COPY . .

# Create data directory
RUN mkdir -p /app/data

ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
