# Railway deployment configuration - Optimized for faster builds
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 py3-pip ffmpeg curl

# Install yt-dlp using curl (more reliable)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Copy package files first for better caching
COPY server/package*.json ./

# Install dependencies with timeout and retry
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --only=production

# Copy source code
COPY server/src ./src
COPY shared ./shared

# Build TypeScript
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV YT_DLP_PATH=/usr/local/bin/yt-dlp

EXPOSE 3001

CMD ["npm", "start"]
