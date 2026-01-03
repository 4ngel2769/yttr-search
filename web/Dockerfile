# syntax=docker/dockerfile:1

# ============================================
# Base stage - shared dependencies
# ============================================
FROM node:20-alpine AS base

# Install dependencies needed for Prisma and Python
RUN apk add --no-cache libc6-compat python3 py3-pip openssl openssl-dev

# ============================================
# Dependencies stage - install node modules
# ============================================
FROM base AS deps
WORKDIR /app

# Copy package files
COPY web/package.json web/package-lock.json* ./
COPY web/prisma ./prisma/

# Install dependencies
RUN npm ci

# ============================================
# Builder stage - build the application
# ============================================
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY web/. .

# Generate Prisma client
RUN npx prisma generate

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN npm run build

# ============================================
# Runner stage - production image
# ============================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create Python virtual environment and install youtube_transcript_api
RUN python3 -m venv /app/.venv && \
    /app/.venv/bin/pip install --no-cache-dir youtube_transcript_api

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy Python script for transcript fetching
COPY --from=builder /app/src/scripts ./src/scripts

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV PYTHON_PATH="/app/.venv/bin/python"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
