# Railway deployment configuration - Multi-stage build for faster deployment
FROM node:18-alpine AS builder

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 py3-pip ffmpeg curl

# Install yt-dlp using curl (more reliable)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Copy package files first for better caching
COPY server/package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci

# Copy source code
COPY server/src ./src
COPY shared ./shared

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install only runtime dependencies
RUN apk add --no-cache python3 py3-pip ffmpeg curl

# Copy yt-dlp from builder stage
COPY --from=builder /usr/local/bin/yt-dlp /usr/local/bin/yt-dlp

# Copy package files
COPY server/package*.json ./

# Install only production dependencies
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV YT_DLP_PATH=/usr/local/bin/yt-dlp

EXPOSE 3001

CMD ["npm", "start"]
