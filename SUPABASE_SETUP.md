# Supabase 设置指南

## 1. 在Supabase中执行SQL Schema

1. 登录到你的Supabase项目：https://qsebfzrtciwylscjpqxv.supabase.co
2. 进入 **SQL Editor**
3. 复制并执行 `supabase-schema.sql` 中的所有SQL命令

## 2. 配置Auth0回调URL

在Auth0控制台中，更新你的应用设置：

### 允许的回调URLs：
```
https://x.mymemo.ai/
http://localhost:3000/
```

### 允许的登出URLs：
```
https://x.mymemo.ai/
http://localhost:3000/
```

### 允许的Web Origins：
```
https://x.mymemo.ai
http://localhost:3000
```

## 3. 环境变量配置

### 服务器端 (.env)
```bash
# Domain Configuration
DOMAIN=x.mymemo.ai
FRONTEND_URL=https://x.mymemo.ai
BACKEND_URL=https://api.x.mymemo.ai
CORS_ORIGIN=https://x.mymemo.ai

# Supabase Configuration
SUPABASE_URL=https://qsebfzrtciwylscjpqxv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzZWJmenJ0Y2l3eWxzY2pwcXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MjEwNjUsImV4cCI6MjA3NTI5NzA2NX0.mBKaMYTWU4A1gpTpSS0pa6W-pc0vQoPqaHSmYpURYL4

# Auth0 Configuration
AUTH0_DOMAIN=dev-supk23n0xgucx0no.us.auth0.com
AUTH0_CLIENT_ID=AsjzEsZrhndYvRZQMSE0MBAfjdGZCt80
AUTH0_CLIENT_SECRET=q_24rvqrjQgwf7UxR5PmPHf0EQPg5GNMQ8rDJ0spGyIxqn1cg2LgA0xFU5Gtso11
AUTH0_AUDIENCE=https://dev-supk23n0xgucx0no.us.auth0.com/api/v2/
AUTH0_ISSUER=https://dev-supk23n0xgucx0no.us.auth0.com/
```

### 客户端 (.env)
```bash
# Auth0 Configuration
REACT_APP_AUTH0_DOMAIN=dev-supk23n0xgucx0no.us.auth0.com
REACT_APP_AUTH0_CLIENT_ID=AsjzEsZrhndYvRZQMSE0MBAfjdGZCt80
REACT_APP_AUTH0_AUDIENCE=https://dev-supk23n0xgucx0no.us.auth0.com/api/v2/
REACT_APP_AUTH0_REDIRECT_URI=https://x.mymemo.ai/

# Domain Configuration
REACT_APP_FRONTEND_URL=https://x.mymemo.ai
REACT_APP_BACKEND_URL=https://api.x.mymemo.ai
```

## 4. Cloudflare DNS设置

在你的Cloudflare控制台中，为 `mymemo.ai` 域名添加以下DNS记录：

### A记录：
- **名称**: `x`
- **内容**: `你的服务器IP地址`
- **代理状态**: 已代理 (橙色云朵)

### A记录：
- **名称**: `api.x`
- **内容**: `你的服务器IP地址`
- **代理状态**: 已代理 (橙色云朵)

## 5. Supabase RLS (行级安全) 说明

由于我们使用Auth0而不是Supabase Auth，RLS策略需要调整。当前策略使用 `auth.uid()` 但Auth0用户ID格式不同。

### 临时解决方案：
在Supabase中暂时禁用RLS进行测试：
```sql
ALTER TABLE memos DISABLE ROW LEVEL SECURITY;
ALTER TABLE collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE memo_collections DISABLE ROW LEVEL SECURITY;
```

### 生产环境解决方案：
需要创建自定义函数来映射Auth0用户ID到Supabase用户ID，或者使用Supabase的JWT验证。

## 6. 部署检查清单

- [ ] Supabase SQL schema已执行
- [ ] Auth0回调URL已更新
- [ ] 环境变量已配置
- [ ] Cloudflare DNS已设置
- [ ] 服务器已部署并运行
- [ ] SSL证书已配置
- [ ] 测试登录功能
- [ ] 测试创建memo功能
