FROM node:20-bookworm-slim

# Install dependencies for Prisma and general tools
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY apps/core-api/package*.json ./apps/core-api/

# Install dependencies
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install

# Copy source code
COPY apps/core-api ./apps/core-api

# Generate Prisma client
WORKDIR /app/apps/core-api
RUN npx prisma generate

# Build core-api
RUN npm run build

# Default environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the API
CMD ["npm", "run", "start"]
