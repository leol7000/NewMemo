# Railway deployment configuration
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 py3-pip ffmpeg

# Install yt-dlp
RUN pip3 install yt-dlp

# Copy package files
COPY server/package*.json ./
RUN npm ci

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
