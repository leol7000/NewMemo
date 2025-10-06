import express from 'express';
import { SupabaseDatabase } from '../services/supabaseDatabase';
import { AIService } from '../services/aiService';
import { optionalAuth } from '../middleware/auth';
import { CreateCollectionRequest, AddMemoToCollectionRequest, ChatRequest, ChatResponse } from '../../shared/types';

const router = express.Router();
const db = new SupabaseDatabase();
const aiService = new AIService();

// 初始化数据库
db.init().catch(console.error);

// 获取所有collections
router.get('/', async (req, res) => {
  try {
    const collections = await db.getAllCollections();
    res.json({ success: true, data: collections });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get collections' });
  }
});

// 获取单个collection
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await db.getCollection(id);
    
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }
    
    res.json({ success: true, data: collection });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get collection' });
  }
});

// 创建新collection
router.post('/', async (req, res) => {
  try {
    const { name, description, color }: CreateCollectionRequest = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Collection name is required' });
    }
    
    const id = `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const collection = await db.createCollection({
      id,
      name,
      description,
      color
    });
    
    res.json({ success: true, data: collection });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create collection' });
  }
});

// 获取collection中的memos
router.get('/:id/memos', async (req, res) => {
  try {
    const { id } = req.params;
    const memos = await db.getCollectionMemos(id);
    res.json({ success: true, data: memos });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get collection memos' });
  }
});

// 添加memo到collection
router.post('/:id/memos', async (req, res) => {
  try {
    const { id } = req.params;
    const { memo_id }: AddMemoToCollectionRequest = req.body;
    
    if (!memo_id) {
      return res.status(400).json({ success: false, error: 'Memo ID is required' });
    }
    
    const collectionMemo = await db.addMemoToCollection(id, memo_id);
    res.json({ success: true, data: collectionMemo });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add memo to collection' });
  }
});

// 从collection中移除memo
router.delete('/:id/memos/:memoId', async (req, res) => {
  try {
    const { id, memoId } = req.params;
    await db.removeMemoFromCollection(id, memoId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to remove memo from collection' });
  }
});

// 删除collection
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteCollection(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete collection' });
  }
});

// Collection 聊天功能
router.post('/:id/chat', async (req, res) => {
  try {
    const { id } = req.params;
    const { message }: ChatRequest = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      } as ChatResponse);
    }
    
    // 获取 collection 中的所有 memos
    const collectionMemos = await db.getCollectionMemos(id);
    
    if (collectionMemos.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Collection is empty'
      } as ChatResponse);
    }
    
    // 构建所有 memos 的内容
    const allContent = collectionMemos.map(memo => 
      `Title: ${memo.memo.title}\nSummary: ${memo.memo.summary}`
    ).join('\n\n');
    
    // 使用 AI 服务进行聊天
    const aiResponse = await aiService.chat(id, message, allContent);
    
    // 保存用户消息
    const userMessage = await db.createChatMessage({
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      memoId: id, // 使用 collection ID 作为 memoId
      role: 'user',
      content: message
    });
    
    // 保存 AI 回复
    const assistantMessage = await db.createChatMessage({
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      memoId: id, // 使用 collection ID 作为 memoId
      role: 'assistant',
      content: aiResponse
    });
    
    res.json({
      success: true,
      data: [userMessage, assistantMessage]
    } as ChatResponse);
    
  } catch (error) {
    console.error('Collection chat error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ChatResponse);
  }
});

// 获取 collection 的聊天记录
router.get('/:id/chat', async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await db.getChatMessages(id); // 使用 collection ID
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get chat messages' });
  }
});

export default router;
