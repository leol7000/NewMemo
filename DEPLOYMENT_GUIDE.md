# 云端部署指南

## 方案1: Vercel + Railway (推荐)

### 前端部署 (Vercel)

1. **准备前端代码**
   ```bash
   cd client
   npm run build
   ```

2. **部署到Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 连接GitHub仓库
   - 选择 `client` 目录作为根目录
   - 设置构建命令: `npm run build`
   - 设置输出目录: `build`

3. **环境变量配置**
   ```
   REACT_APP_API_URL=https://your-backend.railway.app
   REACT_APP_AUTH0_DOMAIN=your-auth0-domain
   REACT_APP_AUTH0_CLIENT_ID=your-auth0-client-id
   ```

### 后端部署 (Railway)

1. **准备后端代码**
   - 确保 `server/Dockerfile.railway` 存在
   - 确保 `railway.toml` 配置正确

2. **部署到Railway**
   - 访问 [railway.app](https://railway.app)
   - 连接GitHub仓库
   - 选择 `server` 目录
   - 添加PostgreSQL数据库

3. **环境变量配置**
   ```
   NODE_ENV=production
   PORT=3001
   YT_DLP_PATH=/usr/local/bin/yt-dlp
   
   # Supabase配置
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # OpenAI配置
   OPENAI_API_KEY=your-openai-api-key
   
   # Auth0配置
   AUTH0_DOMAIN=your-auth0-domain
   AUTH0_AUDIENCE=your-auth0-audience
   ```

## 方案2: Render (全栈)

1. **前端服务**
   - 选择 "Static Site"
   - 连接GitHub仓库
   - 根目录: `client`
   - 构建命令: `npm run build`
   - 发布目录: `build`

2. **后端服务**
   - 选择 "Web Service"
   - 连接GitHub仓库
   - 根目录: `server`
   - 构建命令: `npm install`
   - 启动命令: `npm start`

3. **数据库**
   - 添加PostgreSQL数据库
   - 自动配置连接字符串

## 方案3: DigitalOcean App Platform

1. **创建应用**
   - 选择 "Source" 部署
   - 连接GitHub仓库

2. **配置服务**
   - 前端服务: `client` 目录
   - 后端服务: `server` 目录
   - 数据库: PostgreSQL

3. **环境变量**
   - 在App Platform控制台配置
   - 支持多环境管理

## 部署前检查清单

- [ ] 确保所有环境变量已配置
- [ ] 测试本地构建: `npm run build`
- [ ] 检查数据库连接
- [ ] 验证API端点
- [ ] 测试YouTube功能
- [ ] 配置CORS允许的域名

## 常见问题

### 1. yt-dlp安装失败
```dockerfile
# 在Dockerfile中添加
RUN apk add --no-cache python3 py3-pip ffmpeg
RUN pip3 install yt-dlp
```

### 2. 数据库连接问题
- 检查Supabase配置
- 确保数据库表已创建
- 验证连接字符串

### 3. CORS错误
- 在服务器配置中添加前端域名
- 检查环境变量 `ALLOWED_ORIGINS`

### 4. 内存不足
- Railway免费版有内存限制
- 考虑升级到付费计划
- 优化代码减少内存使用

## 监控和维护

1. **日志监控**
   - Railway: 内置日志查看
   - Vercel: 函数日志
   - Render: 服务日志

2. **性能监控**
   - 设置Uptime监控
   - 监控API响应时间
   - 数据库性能监控

3. **备份策略**
   - 定期数据库备份
   - 代码版本控制
   - 环境变量备份
