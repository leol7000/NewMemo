#!/bin/bash

# 设置环境变量
export PATH="/opt/homebrew/Cellar/node/24.9.0_1/bin:$PATH"
export YT_DLP_PATH="/Users/leo/Library/Python/3.9/bin/yt-dlp"

# 确保yt-dlp在PATH中
export PATH="/Users/leo/Library/Python/3.9/bin:$PATH"

echo "Starting server with environment:"
echo "Node.js: $(which node)"
echo "npm: $(which npm)"
echo "yt-dlp: $(which yt-dlp)"
echo "YT_DLP_PATH: $YT_DLP_PATH"

# 启动开发服务器
npm run dev
