# Supabase Storage 配置

## 🗄️ 全Supabase存储方案

### 数据库: Supabase PostgreSQL
- ✅ 用户数据
- ✅ Memo记录
- ✅ 聊天记录
- ✅ 文件元数据

### 文件存储: Supabase Storage
- ✅ 图片文件
- ✅ 文档文件
- ✅ 视频文件
- ✅ 用户上传

## 📁 Supabase Storage 配置

### 1. 创建存储桶
```sql
-- 创建memos存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('memos', 'memos', true);

-- 创建用户文件存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-files', 'user-files', false);
```

### 2. 设置权限策略
```sql
-- Memos存储桶权限
CREATE POLICY "Users can upload memo files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'memos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view memo files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'memos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 用户文件存储桶权限
CREATE POLICY "Users can upload user files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. 文件记录表
```sql
-- 文件记录表
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memo_id UUID REFERENCES memos(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage路径
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 用户文件表
CREATE TABLE user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Railway后端配置

### 环境变量
```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 文件上传API
```javascript
// server/src/routes/upload.ts
import { supabase } from '../config/supabase';

router.post('/upload', async (req, res) => {
  try {
    const { file, memoId, userId } = req.body;
    
    // 生成文件路径
    const filePath = `${userId}/${memoId}/${Date.now()}-${file.name}`;
    
    // 上传到Supabase Storage
    const { data, error } = await supabase.storage
      .from('memos')
      .upload(filePath, file);
    
    if (error) throw error;
    
    // 获取公共URL
    const { data: { publicUrl } } = supabase.storage
      .from('memos')
      .getPublicUrl(filePath);
    
    // 保存文件记录到数据库
    const { data: fileRecord } = await supabase
      .from('files')
      .insert({
        memo_id: memoId,
        user_id: userId,
        filename: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size
      });
    
    res.json({
      success: true,
      file: {
        id: fileRecord.id,
        filename: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

## 💰 成本分析

### Supabase免费额度
- **数据库**: 500MB
- **存储**: 1GB
- **带宽**: 2GB/月
- **API请求**: 50万/月

### 付费升级
- **Pro计划**: $25/月
- **数据库**: 8GB
- **存储**: 100GB
- **带宽**: 250GB/月

## 🚀 部署步骤

### 1. 配置Supabase
```bash
# 在Supabase Dashboard中
# 1. 创建存储桶
# 2. 设置权限策略
# 3. 创建文件记录表
```

### 2. 更新Railway环境变量
```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 3. 部署
```bash
# 部署Railway
git push origin main

# 部署Cloudflare Pages
# 在Cloudflare Dashboard中连接GitHub
```

## 🔒 安全配置

### 1. 文件类型限制
```javascript
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('File type not allowed');
}
```

### 2. 文件大小限制
```javascript
const maxSize = 10 * 1024 * 1024; // 10MB
if (file.size > maxSize) {
  throw new Error('File too large');
}
```

### 3. 访问控制
- **公开文件**: 通过公共URL访问
- **私有文件**: 需要认证才能访问
- **用户文件**: 只能访问自己的文件
