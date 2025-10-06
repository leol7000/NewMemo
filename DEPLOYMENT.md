# 域名绑定和 Auth0 集成配置指南

## 1. 域名绑定配置

### 服务器端配置
在 `server/.env` 文件中添加以下配置：

```bash
# Domain Configuration
DOMAIN=your-domain.com
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com

# CORS Configuration (更新为你的域名)
CORS_ORIGIN=https://your-domain.com
```

### 前端配置
在 `client/.env` 文件中添加以下配置：

```bash
# Domain Configuration
REACT_APP_DOMAIN=your-domain.com
REACT_APP_FRONTEND_URL=https://your-domain.com
REACT_APP_BACKEND_URL=https://api.your-domain.com
```

## 2. Auth0 配置

### Auth0 控制台设置
1. 登录 Auth0 控制台
2. 创建新的 Single Page Application
3. 配置以下设置：

**Allowed Callback URLs:**
```
https://your-domain.com
http://localhost:3000 (开发环境)
```

**Allowed Logout URLs:**
```
https://your-domain.com
http://localhost:3000 (开发环境)
```

**Allowed Web Origins:**
```
https://your-domain.com
http://localhost:3000 (开发环境)
```

**Allowed Origins (CORS):**
```
https://your-domain.com
http://localhost:3000 (开发环境)
```

### 服务器端 Auth0 配置
在 `server/.env` 文件中添加：

```bash
# Auth0 Configuration
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
AUTH0_AUDIENCE=your-auth0-audience
AUTH0_ISSUER=https://your-auth0-domain.auth0.com/
```

### 前端 Auth0 配置
在 `client/.env` 文件中添加：

```bash
# Auth0 Configuration
REACT_APP_AUTH0_DOMAIN=your-auth0-domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-auth0-client-id
REACT_APP_AUTH0_AUDIENCE=your-auth0-audience
REACT_APP_AUTH0_REDIRECT_URI=https://your-domain.com
```

## 3. 部署步骤

### 使用 Vercel 部署前端
1. 连接 GitHub 仓库到 Vercel
2. 设置环境变量
3. 配置自定义域名

### 使用 Railway/Heroku 部署后端
1. 连接 GitHub 仓库
2. 设置环境变量
3. 配置自定义域名

### 使用 Nginx 反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name api.your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 4. SSL 证书配置

### 使用 Let's Encrypt
```bash
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

## 5. 测试配置

### 检查服务器健康状态
```bash
curl https://api.your-domain.com/api/health
```

### 检查 Auth0 集成
1. 访问前端应用
2. 点击登录按钮
3. 验证 Auth0 登录流程
4. 检查用户信息获取

## 6. 常见问题

### CORS 错误
- 确保所有域名都在 CORS_ORIGIN 中配置
- 检查 Auth0 的 Allowed Origins 设置

### Auth0 重定向错误
- 检查 Callback URLs 配置
- 确保 redirect_uri 参数正确

### 域名解析问题
- 检查 DNS 设置
- 确保域名指向正确的服务器 IP
