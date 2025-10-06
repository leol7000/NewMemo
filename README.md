# Mymemo AI 3.0

AI驱动的网页内容总结工具

## 功能特性

- 🌐 支持任意网页链接的内容抓取和AI总结
- 📺 支持YouTube视频脚本获取和总结
- 🎴 生成美观的总结卡片
- 💬 AI对话功能，可以询问具体内容
- 📱 现代化的响应式界面
- 🔄 自动检测YouTube链接类型

## 技术栈

- **前端**: React + TypeScript + Tailwind CSS
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite
- **AI**: OpenAI API
- **网页抓取**: Puppeteer + Cheerio
- **YouTube**: youtube-transcript

## 快速开始

### 方法一：使用启动脚本（推荐）

**macOS/Linux:**
```bash
./start.sh
```

**Windows:**
```cmd
start.bat
```

### 方法二：手动启动

1. 安装依赖
```bash
npm run install:all
```

2. 配置环境变量
```bash
cp server/env.example server/.env
# 编辑 server/.env 文件，添加你的 OpenAI API Key
```

3. 启动开发服务器
```bash
npm run dev
```

4. 访问 http://localhost:3000

## 环境配置

在 `server/.env` 文件中配置以下变量：

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_PATH=./data/flymemo.db

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## 使用说明

1. **添加网页链接**: 在首页输入任意网页链接，系统会自动抓取内容并生成AI总结
2. **添加YouTube视频**: 输入YouTube视频链接，系统会获取视频脚本并生成总结
3. **查看总结卡片**: 每个总结都会生成一张美观的卡片，显示标题、总结和元数据
4. **AI对话**: 点击"开始对话"按钮，可以与AI就总结内容进行深入讨论

## 项目结构

```
flymemo/
├── client/              # React前端应用
│   ├── src/
│   │   ├── components/  # React组件
│   │   ├── pages/       # 页面组件
│   │   ├── contexts/    # React Context
│   │   ├── services/    # API服务
│   │   └── ...
├── server/              # Node.js后端API
│   ├── src/
│   │   ├── routes/      # API路由
│   │   ├── services/    # 业务服务
│   │   ├── database.ts  # 数据库操作
│   │   └── index.ts    # 服务器入口
├── shared/              # 共享类型定义
├── start.sh            # macOS/Linux启动脚本
├── start.bat           # Windows启动脚本
└── README.md
```

## API接口

### 总结接口
- `POST /api/summarize` - 创建新的总结

### 备忘录接口
- `GET /api/memos` - 获取所有备忘录
- `GET /api/memos/:id` - 获取单个备忘录
- `DELETE /api/memos/:id` - 删除备忘录

### 聊天接口
- `POST /api/chat` - 发送聊天消息
- `GET /api/chat/:memoId` - 获取聊天历史

## 开发说明

- 前端运行在 http://localhost:3000
- 后端API运行在 http://localhost:3001
- 数据库文件存储在 `server/data/flymemo.db`
- 支持热重载开发

## 注意事项

1. 需要有效的OpenAI API Key才能使用AI功能
2. 网页抓取可能需要一些时间，请耐心等待
3. YouTube视频需要有可用的脚本才能生成总结
4. 建议使用现代浏览器以获得最佳体验
# Trigger rebuild
