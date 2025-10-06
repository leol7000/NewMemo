@echo off
echo 🚀 启动 Flymemo...

REM 检查是否安装了 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 请先安装 Node.js (https://nodejs.org/)
    pause
    exit /b 1
)

REM 检查是否安装了 npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 请先安装 npm
    pause
    exit /b 1
)

REM 安装依赖
echo 📦 安装依赖...
call npm run install:all

REM 检查环境变量文件
if not exist "server\.env" (
    echo ⚠️  请先配置环境变量:
    echo 1. 复制 server\env.example 到 server\.env
    echo 2. 在 server\.env 中添加你的 OpenAI API Key
    echo.
    echo copy server\env.example server\.env
    echo 然后编辑 server\.env 文件
    pause
    exit /b 1
)

REM 启动服务
echo 🎉 启动 Flymemo...
call npm run dev
pause
