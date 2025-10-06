# Cloudflare Pages + Workers 部署指南

## 🚀 方案概述

**前端**: Cloudflare Pages (React应用)
**后端**: Cloudflare Workers (API代理)
**数据库**: Supabase (外部服务)
**文件存储**: Cloudflare R2

## 📋 部署步骤

### 1. 准备代码

```bash
# 确保代码已推送到GitHub
git add .
git commit -m "Prepare for Cloudflare deployment"
git push origin main
```

### 2. 部署前端 (Cloudflare Pages)

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
   REACT_APP_API_URL=https://your-worker.your-subdomain.workers.dev
   REACT_APP_AUTH0_DOMAIN=your-auth0-domain
   REACT_APP_AUTH0_CLIENT_ID=your-auth0-client-id
   ```

5. **部署**
   - 点击 "Save and Deploy"
   - 等待构建完成

### 3. 部署后端 (Cloudflare Workers)

1. **安装 Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **登录 Cloudflare**
   ```bash
   wrangler login
   ```

3. **创建 D1 数据库**
   ```bash
   wrangler d1 create mymemo-db
   ```

4. **创建 KV 命名空间**
   ```bash
   wrangler kv:namespace create "MEMO_CACHE"
   ```

5. **创建 R2 存储桶**
   ```bash
   wrangler r2 bucket create mymemo-files
   ```

6. **更新 wrangler.toml**
   - 将生成的数据库ID和KV命名空间ID填入配置文件

7. **部署 Worker**
   ```bash
   wrangler deploy
   ```

### 4. 配置数据库

1. **使用 Supabase (推荐)**
   - 保持现有的Supabase配置
   - 在Worker中转发请求到Supabase

2. **或使用 Cloudflare D1**
   ```sql
   -- 创建memos表
   CREATE TABLE IF NOT EXISTS memos (
     id TEXT PRIMARY KEY,
     url TEXT NOT NULL,
     title TEXT NOT NULL,
     summary TEXT NOT NULL,
     type TEXT NOT NULL,
     status TEXT DEFAULT 'processing',
     user_id TEXT,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
   );
   ```

### 5. 配置域名

1. **自定义域名**
   - 在Cloudflare Pages设置中添加自定义域名
   - 在Workers设置中配置路由

2. **SSL证书**
   - Cloudflare自动提供SSL证书
   - 确保HTTPS重定向已启用

## 🔧 环境变量配置

### Cloudflare Pages
```
REACT_APP_API_URL=https://your-worker.your-subdomain.workers.dev
REACT_APP_AUTH0_DOMAIN=your-auth0-domain
REACT_APP_AUTH0_CLIENT_ID=your-auth0-client-id
```

### Cloudflare Workers
```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
AUTH0_DOMAIN=your-auth0-domain
AUTH0_AUDIENCE=your-auth0-audience
```

## 📊 监控和维护

### 1. 性能监控
- **Cloudflare Analytics**: 查看访问统计
- **Workers Analytics**: 监控API性能
- **Real User Monitoring**: 用户体验监控

### 2. 日志查看
```bash
# 查看Worker日志
wrangler tail

# 查看Pages构建日志
# 在Cloudflare Dashboard中查看
```

### 3. 缓存管理
```bash
# 清除缓存
wrangler kv:key delete "cache-key" --namespace-id=your-namespace-id
```

## 💰 成本分析

### 免费额度
- **Cloudflare Pages**: 无限制带宽，500构建/月
- **Cloudflare Workers**: 100,000请求/天
- **D1 数据库**: 5GB存储，5M读取/月
- **R2 存储**: 10GB存储，1M请求/月

### 付费升级
- **Workers Paid**: $5/月，1000万请求
- **D1 Paid**: $5/月，25GB存储
- **R2 Paid**: $0.015/GB/月

## 🚨 注意事项

### 1. Workers限制
- **CPU时间**: 10ms (免费) / 50ms (付费)
- **内存**: 128MB
- **请求大小**: 100MB

### 2. 解决方案
- **复杂处理**: 转发到Railway/Render
- **大文件**: 使用R2存储
- **长时间任务**: 使用Queue Workers

### 3. 最佳实践
- 使用缓存减少API调用
- 优化Worker代码减少CPU时间
- 使用Durable Objects处理状态

## 🔄 更新部署

```bash
# 更新Worker
wrangler deploy

# 更新Pages (自动)
git push origin main
```

## 🆘 故障排除

### 1. 构建失败
- 检查Node.js版本
- 验证环境变量
- 查看构建日志

### 2. Worker错误
- 检查wrangler.toml配置
- 验证环境变量
- 查看Worker日志

### 3. API调用失败
- 检查CORS配置
- 验证URL重写规则
- 测试API端点
