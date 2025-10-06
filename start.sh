#!/bin/bash

# Flymemo 启动脚本

echo "🚀 启动 Flymemo..."

# 检查是否安装了 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js (https://nodejs.org/)"
    exit 1
fi

# 检查是否安装了 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 请先安装 npm"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm run install:all

# 检查环境变量文件
if [ ! -f "server/.env" ]; then
    echo "⚠️  请先配置环境变量:"
    echo "1. 复制 server/env.example 到 server/.env"
    echo "2. 在 server/.env 中添加你的 OpenAI API Key"
    echo ""
    echo "cp server/env.example server/.env"
    echo "然后编辑 server/.env 文件"
    exit 1
fi

# 启动服务
echo "🎉 启动 Flymemo..."
npm run dev
