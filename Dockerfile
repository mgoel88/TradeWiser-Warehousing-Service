# Multi-stage build for TradeWiser Platform
# Ubuntu-compatible base with Node.js
# Stage 1: Build stage
FROM node:20-alpine AS builder

# Install build dependencies including Ubuntu compatibility tools
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    bash \
    postgresql-client

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine AS production

# Install runtime dependencies including Ubuntu compatibility
RUN apk add --no-cache \
    postgresql-client \
    curl \
    bash \
    ca-certificates \
    tzdata \
    && update-ca-certificates

# Set timezone (useful for production)
ENV TZ=UTC

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S tradewiser -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for Docker environment)
RUN npm ci && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create server/public directory and copy built files there for production serving
RUN mkdir -p server/public && cp -r dist/public/* server/public/

# Copy necessary runtime files from builder stage
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/db ./db
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

# Create necessary directories
RUN mkdir -p uploads logs

# Set permissions for entry point
RUN chmod +x ./docker-entrypoint.sh

# Change ownership to non-root user
RUN chown -R tradewiser:nodejs /app
USER tradewiser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/api/test || exit 1

# Use entry point script
ENTRYPOINT ["./docker-entrypoint.sh"]