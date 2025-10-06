#!/bin/bash
set -e

echo "Installing dependencies..."
cd server
npm install

echo "Installing yt-dlp..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp

echo "Building TypeScript..."
npm run build

echo "Build completed successfully!"
