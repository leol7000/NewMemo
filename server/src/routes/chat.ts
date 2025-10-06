import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AIService } from '../services/aiService';
import { Database } from '../database';
import { ChatRequest, ChatResponse } from '../../shared/types';

const router = Router();
const aiService = new AIService();
const db = new Database();

// 初始化数据库
db.init().catch(console.error);

router.post('/', async (req, res) => {
  try {
    const { memoId, message }: ChatRequest = req.body;

    if (!memoId || !message) {
      return res.status(400).json({
        success: false,
        error: 'MemoId and message are required'
      } as ChatResponse);
    }

    // 获取备忘录内容
    const memo = await db.getMemo(memoId);
    if (!memo) {
      return res.status(404).json({
        success: false,
        error: 'Memo not found'
      } as ChatResponse);
    }

    // 保存用户消息
    const userMessageId = uuidv4();
    const userMessage = await db.createChatMessage({
      id: userMessageId,
      memoId,
      role: 'user',
      content: message
    });

    // 获取AI回复
    let aiResponse;
    try {
      aiResponse = await aiService.chat(memoId, message, memo.summary);
    } catch (error: any) {
      // 如果AI服务失败，返回友好提示
      if (error.message.includes('API key') || error.message.includes('401')) {
        aiResponse = "I'm sorry, but I need a valid OpenAI API key to respond. Please configure your API key in the server settings.";
      } else {
        aiResponse = "I'm sorry, I encountered an error while processing your request. Please try again.";
      }
    }

    // 保存AI回复
    const aiMessageId = uuidv4();
    const aiMessage = await db.createChatMessage({
      id: aiMessageId,
      memoId,
      role: 'assistant',
      content: aiResponse
    });

    res.json({
      success: true,
      data: [userMessage, aiMessage] // 返回用户消息和AI回复
    } as ChatResponse);

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ChatResponse);
  }
});

router.get('/:memoId', async (req, res) => {
  try {
    const { memoId } = req.params;
    const messages = await db.getChatMessages(memoId);
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as chatRouter };
