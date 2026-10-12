# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy workspace files and base config
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json .npmrc* ./
COPY packages/flexdesk-server/package.json ./packages/flexdesk-server/
COPY packages/flexdesk-types/package.json ./packages/flexdesk-types/
COPY packages/flexdesk-core/package.json ./packages/flexdesk-core/
COPY packages/flexdesk-utils/package.json ./packages/flexdesk-utils/

# Copy Prisma schema before install (needed for postinstall prisma generate)
COPY packages/flexdesk-server/prisma ./packages/flexdesk-server/prisma

# Install dependencies with shamefully-hoist for flat node_modules
RUN pnpm install --shamefully-hoist

# Copy source code
COPY packages/flexdesk-server ./packages/flexdesk-server
COPY packages/flexdesk-types ./packages/flexdesk-types
COPY packages/flexdesk-core ./packages/flexdesk-core
COPY packages/flexdesk-utils ./packages/flexdesk-utils

# Build shared packages first
RUN pnpm --filter @service-flex/types build
RUN pnpm --filter @service-flex/core build
RUN pnpm --filter flexdesk-utils build

# Build server
RUN pnpm --filter flexdesk-server build

# Production stage
FROM node:20-alpine AS runner

RUN npm install -g prisma@6.19.2

WORKDIR /app

ENV NODE_ENV=production

# Copy built server and flat node_modules
COPY --from=builder /app/packages/flexdesk-server/dist ./dist
COPY --from=builder /app/packages/flexdesk-server/package.json ./
COPY --from=builder /app/packages/flexdesk-server/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3001

CMD ["sh", "-c", "prisma migrate deploy && node dist/main"]
