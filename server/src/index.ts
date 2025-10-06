import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Database } from './database';
import { SupabaseDatabase } from './services/supabaseDatabase';
import { checkSupabaseConfig } from './config/supabase';
import { summarizeRouter } from './routes/summarize';
import { chatRouter } from './routes/chat';
import { memosRouter } from './routes/memos';
import collectionsRouter from './routes/collections';
import { notesRouter } from './routes/notes';
import { authenticateToken, optionalAuth } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 获取允许的域名列表
const getAllowedOrigins = () => {
  const origins = [process.env.CORS_ORIGIN || 'http://localhost:3000'];
  
  // 添加生产环境域名
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  
  // 添加开发环境域名
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001');
  }
  
  return origins;
};

// 中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // 允许没有 origin 的请求（如移动应用）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 检查Supabase配置
const isSupabaseConfigured = checkSupabaseConfig();

// 初始化数据库 - 优先使用Supabase，回退到SQLite
const db = isSupabaseConfigured ? new SupabaseDatabase() : new Database();
db.init();

// 路由 - 重新启用认证中间件
app.use('/api/summarize', optionalAuth, summarizeRouter);
app.use('/api/chat', optionalAuth, chatRouter);
app.use('/api/memos', optionalAuth, memosRouter);
app.use('/api/collections', optionalAuth, collectionsRouter);
app.use('/api/notes', optionalAuth, notesRouter);

// 认证相关路由
app.get('/api/auth/profile', authenticateToken, (req: any, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.sub,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture
    }
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    domain: process.env.DOMAIN
  });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Mymemo AI 3.0 server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Auth0 Domain: ${process.env.AUTH0_DOMAIN || 'Not configured'}`);
  console.log(`🗄️ Database: ${isSupabaseConfigured ? 'Supabase PostgreSQL' : 'SQLite'}`);
  console.log(`🌍 Allowed Origins: ${getAllowedOrigins().join(', ')}`);
  if (process.env.DOMAIN) {
    console.log(`🎯 Domain: ${process.env.DOMAIN}`);
  }
});
