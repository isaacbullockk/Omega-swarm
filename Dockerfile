FROM node:20-slim

WORKDIR /app

# Force Docker to never cache — changes on every commit
ADD https://api.github.com/repos/isaacbullockk/Omega-swarm/commits?per_page=1 /tmp/latest-commit

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
CMD ["npm", "start"]
