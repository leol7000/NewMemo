# 完整存储方案配置

## 🗄️ 存储架构

### 1. 数据库存储
- **Supabase PostgreSQL**: 用户数据、memo记录、聊天记录
- **优势**: 关系型数据库、SQL查询、实时订阅

### 2. 文件存储
- **Cloudflare R2**: 图片、视频、文档
- **优势**: 免费10GB、全球CDN、S3兼容

### 3. 缓存存储
- **Cloudflare KV**: 临时缓存、会话数据
- **优势**: 全球分布、毫秒级访问

## 📁 具体配置

### Cloudflare R2 配置
```javascript
// 上传文件到R2
export default {
  async fetch(request, env) {
    if (request.method === 'POST' && url.pathname === '/api/upload') {
      const formData = await request.formData();
      const file = formData.get('file');
      
      // 上传到R2
      await env.FILES.put(`uploads/${Date.now()}-${file.name}`, file);
      
      return new Response(JSON.stringify({
        success: true,
        url: `https://your-r2-domain.com/uploads/${file.name}`
      }));
    }
  }
};
```

### Supabase 存储配置
```sql
-- 文件记录表
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memo_id UUID REFERENCES memos(id),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 用户文件表
CREATE TABLE user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 环境变量

### Cloudflare Workers
```
R2_BUCKET_NAME=mymemo-files
R2_DOMAIN=https://your-r2-domain.com
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Railway 后端
```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
R2_ACCESS_KEY=your-r2-access-key
R2_SECRET_KEY=your-r2-secret-key
R2_BUCKET_NAME=mymemo-files
```

## 📊 存储策略

### 1. 图片存储
- **封面图片**: R2存储
- **用户头像**: R2存储
- **缩略图**: R2存储

### 2. 文档存储
- **PDF文件**: R2存储
- **文本文件**: R2存储
- **压缩文件**: R2存储

### 3. 缓存策略
- **热门内容**: KV缓存
- **用户会话**: KV缓存
- **API响应**: KV缓存

## 💰 成本分析

### 免费额度
- **Supabase**: 500MB数据库
- **Cloudflare R2**: 10GB存储
- **Cloudflare KV**: 1000个键值对

### 付费升级
- **Supabase**: $25/月 (8GB数据库)
- **Cloudflare R2**: $0.015/GB/月
- **Cloudflare KV**: $0.50/百万读取

## 🚀 部署步骤

### 1. 创建R2存储桶
```bash
wrangler r2 bucket create mymemo-files
```

### 2. 配置自定义域名
```bash
wrangler r2 bucket domain add mymemo-files your-domain.com
```

### 3. 更新wrangler.toml
```toml
[[r2_buckets]]
binding = "FILES"
bucket_name = "mymemo-files"
```

### 4. 部署Workers
```bash
wrangler deploy
```

## 🔒 安全配置

### 1. 访问控制
- **公开文件**: 直接访问
- **私有文件**: 签名URL
- **用户文件**: 权限验证

### 2. 文件类型限制
- **允许**: jpg, png, gif, pdf, txt
- **禁止**: exe, bat, sh, php

### 3. 文件大小限制
- **图片**: 最大10MB
- **文档**: 最大50MB
- **视频**: 最大100MB
