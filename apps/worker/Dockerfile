FROM node:20-bookworm-slim

WORKDIR /app

# Cài đặt các thư viện hệ thống tối thiểu
RUN apt-get update && apt-get install -y \
    python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY apps/worker/package.json ./apps/worker/

RUN npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install

# Copy Prisma schema từ core-api và generate client
COPY apps/core-api/prisma ./apps/core-api/prisma
WORKDIR /app/apps/worker
RUN npx prisma generate --schema ../core-api/prisma/schema.prisma

WORKDIR /app
COPY apps/worker ./apps/worker

RUN npm run build -w @code-judge/worker

CMD ["npm", "run", "start", "-w", "@code-judge/worker"]
