# Cloudflare Pages + Railway 混合方案 (推荐)

## 🚀 架构设计

**前端**: Cloudflare Pages (React应用)
**后端**: Railway (Node.js + PostgreSQL)
**CDN**: Cloudflare (全球加速)

## ✅ 优势

- **前端完全免费** - Cloudflare Pages
- **全球CDN加速** - 超快访问速度
- **后端稳定可靠** - Railway $5/月
- **自动部署** - Git推送即部署
- **无CPU限制** - 支持复杂YouTube处理

## 📋 部署步骤

### 1. 部署前端 (Cloudflare Pages)

1. **访问 Cloudflare Dashboard**
   - 登录 [dash.cloudflare.com](https://dash.cloudflare.com)
   - 选择 "Pages" 服务

2. **连接项目**
   - 点击 "Create a project"
   - 选择 "Connect to Git"
   - 连接你的GitHub仓库

3. **配置构建**
   - **Framework preset**: Create React App
   - **Build command**: `cd client && npm run build`
   - **Build output directory**: `client/build`
   - **Root directory**: `/` (项目根目录)

4. **环境变量**
   ```
   REACT_APP_API_URL=https://your-app.railway.app
   REACT_APP_AUTH0_DOMAIN=your-auth0-domain
   REACT_APP_AUTH0_CLIENT_ID=your-auth0-client-id
   ```

5. **自定义域名** (可选)
   - 添加你的域名
   - Cloudflare自动提供SSL证书

### 2. 部署后端 (Railway)

1. **访问 Railway**
   - 登录 [railway.app](https://railway.app)
   - 连接GitHub仓库

2. **创建项目**
   - 选择 "Deploy from GitHub repo"
   - 选择你的仓库
   - 选择 `server` 目录

3. **添加数据库**
   - 点击 "New" → "Database" → "PostgreSQL"
   - Railway自动配置连接字符串

4. **环境变量**
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
   
   # CORS配置
   ALLOWED_ORIGINS=https://your-pages.pages.dev,https://your-domain.com
   ```

5. **部署**
   - Railway自动检测Dockerfile
   - 开始构建和部署

### 3. 配置CORS

在Railway后端添加前端域名到允许列表：

```javascript
// server/src/index.ts
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-pages.pages.dev',
  'https://your-domain.com'
];
```

## 🔧 配置文件

### Cloudflare Pages 重定向
```toml
# _redirects 文件
/api/* https://your-app.railway.app/api/:splat 200
/* /index.html 200
```

### Railway Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 py3-pip ffmpeg

# Install yt-dlp
RUN pip3 install yt-dlp

# Copy package files
COPY server/package*.json ./
RUN npm ci --only=production

# Copy source code
COPY server/src ./src
COPY shared ./shared

# Set environment variables
ENV NODE_ENV=production
ENV YT_DLP_PATH=/usr/local/bin/yt-dlp

EXPOSE 3001

CMD ["npm", "start"]
```

## 📊 性能优化

### 1. Cloudflare优化
- **缓存策略**: 静态资源长期缓存
- **压缩**: 自动Gzip压缩
- **HTTP/2**: 自动启用
- **CDN**: 全球200+节点

### 2. Railway优化
- **健康检查**: 自动重启
- **日志监控**: 实时日志查看
- **自动扩展**: 根据负载调整

## 💰 成本分析

### 免费额度
- **Cloudflare Pages**: 无限制带宽
- **Railway**: $5/月，500小时

### 总成本
- **前端**: 免费
- **后端**: $5/月
- **总计**: $5/月

## 🔄 更新流程

### 前端更新
```bash
git push origin main
# Cloudflare Pages自动部署
```

### 后端更新
```bash
git push origin main
# Railway自动部署
```

## 🚨 注意事项

1. **环境变量**: 确保所有必要的环境变量已配置
2. **CORS**: 添加前端域名到允许列表
3. **SSL**: Cloudflare自动提供SSL证书
4. **监控**: 使用Railway监控后端性能

## 🆘 故障排除

### 1. 前端问题
- 检查构建日志
- 验证环境变量
- 检查重定向规则

### 2. 后端问题
- 查看Railway日志
- 检查环境变量
- 验证数据库连接

### 3. API调用失败
- 检查CORS配置
- 验证API URL
- 测试网络连接
