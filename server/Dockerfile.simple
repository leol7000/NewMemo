# Simplified Dockerfile for Railway - Minimal dependencies
FROM node:18-alpine

WORKDIR /app

# Install minimal system dependencies
RUN apk add --no-cache curl

# Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Copy package files
COPY server/package*.json ./

# Install dependencies with aggressive timeout settings
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 30000 && \
    npm config set fetch-retry-maxtimeout 300000 && \
    npm config set fetch-retries 5 && \
    npm install --production --no-optional

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
