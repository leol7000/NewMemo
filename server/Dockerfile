FROM node:18

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm install

# Install yt-dlp
RUN apt-get update && apt-get install -y curl && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Copy source code
COPY server/src ./src
COPY shared ./shared

# Build
RUN npm run build

# Set environment
ENV NODE_ENV=production
ENV YT_DLP_PATH=/usr/local/bin/yt-dlp

EXPOSE 3001

CMD ["npm", "start"]