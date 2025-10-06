# 🔐 Auth0 配置完整指南

## 第一步：创建 Auth0 应用

### 1. 登录 Auth0 控制台
访问 [https://manage.auth0.com/](https://manage.auth0.com/) 并登录

### 2. 创建 Single Page Application
1. 点击 "Applications" → "Create Application"
2. 选择 "Single Page Application"
3. 输入应用名称：`Mymemo AI 3.0`
4. 点击 "Create"

### 3. 配置应用设置
在应用设置页面，找到以下配置项：

**Allowed Callback URLs:**
```
http://localhost:3000
https://your-domain.com
```

**Allowed Logout URLs:**
```
http://localhost:3000
https://your-domain.com
```

**Allowed Web Origins:**
```
http://localhost:3000
https://your-domain.com
```

**Allowed Origins (CORS):**
```
http://localhost:3000
https://your-domain.com
```

## 第二步：获取配置信息

从 Auth0 应用设置页面复制以下信息：
- **Domain**: `your-tenant.auth0.com`
- **Client ID**: `your-client-id`
- **Client Secret**: `your-client-secret` (如果需要)

## 第三步：配置环境变量

### 服务器端配置 (`server/.env`)
```bash
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=https://your-tenant.auth0.com/api/v2/
AUTH0_ISSUER=https://your-tenant.auth0.com/

# Domain Configuration (替换为你的实际域名)
DOMAIN=your-domain.com
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com
CORS_ORIGIN=https://your-domain.com
```

### 前端配置 (`client/.env`)
```bash
# Auth0 Configuration
REACT_APP_AUTH0_DOMAIN=your-tenant.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-client-id
REACT_APP_AUTH0_AUDIENCE=https://your-tenant.auth0.com/api/v2/
REACT_APP_AUTH0_REDIRECT_URI=http://localhost:3000
```

## 第四步：测试配置

### 1. 重启服务器
```bash
cd server && npm run dev
```

### 2. 启动前端
```bash
cd client && npm start
```

### 3. 测试登录
1. 访问 `http://localhost:3000`
2. 点击登录按钮
3. 应该会跳转到 Auth0 登录页面
4. 登录成功后返回应用

## 第五步：部署到生产环境

### 1. 更新生产环境配置
在 `client/.env` 中更新：
```bash
REACT_APP_AUTH0_REDIRECT_URI=https://your-domain.com
```

### 2. 更新 Auth0 应用设置
在 Auth0 控制台中添加生产环境 URL：
- **Allowed Callback URLs**: `https://your-domain.com`
- **Allowed Logout URLs**: `https://your-domain.com`
- **Allowed Web Origins**: `https://your-domain.com`
- **Allowed Origins (CORS)**: `https://your-domain.com`

## 常见问题解决

### 1. CORS 错误
- 确保所有域名都在 Auth0 的 Allowed Origins 中
- 检查服务器端的 CORS_ORIGIN 配置

### 2. 重定向错误
- 检查 Callback URLs 配置
- 确保 redirect_uri 参数正确

### 3. Token 验证失败
- 检查 AUTH0_DOMAIN 和 AUTH0_AUDIENCE 配置
- 确保 JWT 签名密钥正确

## 快速测试命令

```bash
# 检查服务器健康状态
curl http://localhost:3001/api/health

# 检查 Auth0 配置
curl http://localhost:3001/api/auth/profile
```

现在按照这个指南配置你的 Auth0 应用吧！需要我帮你解决任何具体问题吗？
