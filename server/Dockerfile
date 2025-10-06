# Railway deployment configuration
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY server/package*.json ./
RUN npm ci --only=production

# Copy source code
COPY server/src ./src
COPY shared ./shared

# Install yt-dlp
RUN apk add --no-cache python3 py3-pip
RUN pip3 install yt-dlp

# Set environment variables
ENV NODE_ENV=production
ENV YT_DLP_PATH=/usr/local/bin/yt-dlp

EXPOSE 3001

CMD ["npm", "start"]
