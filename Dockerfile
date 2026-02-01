# ============================================
# A2A Knowledge Marketplace - API Dockerfile
# Multi-stage build for dev and production
# ============================================

# Stage 1: Base with dependencies
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies only
COPY packages/api/package*.json ./packages/api/
COPY packages/shared/package*.json ./packages/shared/
COPY package*.json ./

RUN npm install

# Stage 2: Development
FROM base AS dev

WORKDIR /app

# Copy source code
COPY packages/api ./packages/api
COPY packages/shared ./packages/shared
COPY tsconfig.json ./

# Expose ports
EXPOSE 4021 4022

# Environment
ENV NODE_ENV=development

# Start dev server
CMD ["npm", "run", "dev:api"]

# Stage 3: Build for production
FROM base AS build

WORKDIR /app

# Copy source code
COPY packages/api ./packages/api
COPY packages/shared ./packages/shared
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build -w packages/api

# Stage 4: Production
FROM node:20-alpine AS prod

WORKDIR /app

# Copy only production dependencies and built files
COPY --from=build /app/packages/api/dist ./dist
COPY --from=build /app/packages/api/package*.json ./
COPY --from=build /app/node_modules ./node_modules

# Expose ports
EXPOSE 4021 4022

# Environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4021/health || exit 1

# Start production server
CMD ["node", "dist/server.js"]
