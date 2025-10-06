import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Database } from './database';
import { summarizeRouter } from './routes/summarize';
import { chatRouter } from './routes/chat';
import { memosRouter } from './routes/memos';
import collectionsRouter from './routes/collections';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// 初始化数据库
const db = new Database();
db.init();

// 路由
app.use('/api/summarize', summarizeRouter);
app.use('/api/chat', chatRouter);
app.use('/api/memos', memosRouter);
app.use('/api/collections', collectionsRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Mymemo AI 3.0 server running on port ${PORT}`);
});
