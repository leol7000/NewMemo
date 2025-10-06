#!/bin/bash

# 设置环境变量 - 从.env文件加载
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# 默认值
export PORT="3001"
export NODE_ENV="development"
export CORS_ORIGIN="http://localhost:3000"

# 启动服务器
npm run dev
