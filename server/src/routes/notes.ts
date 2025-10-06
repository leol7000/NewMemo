import express from 'express';
import { SupabaseDatabase } from '../services/supabaseDatabase';
import { AIService } from '../services/aiService';
import { optionalAuth } from '../middleware/auth';
import { CreateNoteRequest, UpdateNoteRequest, NoteChatRequest, NoteChatResponse } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const db = new SupabaseDatabase();
const aiService = new AIService();

// 初始化数据库
db.init().catch(console.error);

// 获取所有笔记
router.get('/', async (req: any, res) => {
  try {
    const userId = req.user?.sub;
    const notes = await db.getAllNotes(userId);
    res.json({ success: true, data: notes });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ success: false, error: 'Failed to get notes' });
  }
});

// 获取单个笔记
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const note = await db.getNote(id);
    
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    
    res.json({ success: true, data: note });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ success: false, error: 'Failed to get note' });
  }
});

// 创建新笔记
router.post('/', async (req: any, res) => {
  try {
    const { title, content }: CreateNoteRequest = req.body;
    const userId = req.user?.sub;
    
    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }
    
    const id = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const note = await db.createNote({
      id,
      title,
      content,
      status: 'draft'
    }, userId);
    
    res.json({ success: true, data: note });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ success: false, error: 'Failed to create note' });
  }
});

// 更新笔记
router.put('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const updates: UpdateNoteRequest = req.body;
    
    const updatedNote = await db.updateNote(id, updates);
    
    if (!updatedNote) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    
    res.json({ success: true, data: updatedNote });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ success: false, error: 'Failed to update note' });
  }
});

// 删除笔记
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteNote(id);
    
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete note' });
  }
});

// 总结笔记内容
router.post('/:id/summarize', async (req, res) => {
  try {
    const { id } = req.params;
    const note = await db.getNote(id);
    
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    
    // 使用 AI 服务总结笔记内容
    const result = await aiService.summarizeNoteContent(note.content);
    
    // 更新笔记
    const updatedNote = await db.updateNote(id, {
      summary: result.summary,
      oneLineSummary: result.oneLineSummary,
      keyPoints: result.keyPoints,
      status: 'completed'
    });
    
    res.json({ success: true, data: updatedNote });
  } catch (error) {
    console.error('Summarize note error:', error);
    res.status(500).json({ success: false, error: 'Failed to summarize note' });
  }
});

// 笔记聊天
router.post('/:id/chat', async (req, res) => {
  try {
    const { id } = req.params;
    const { message }: NoteChatRequest = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      } as NoteChatResponse);
    }
    
    // 获取笔记内容
    const note = await db.getNote(id);
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      } as NoteChatResponse);
    }
    
    // 保存用户消息
    const userMessageId = uuidv4();
    const userMessage = await db.createNoteChatMessage({
      id: userMessageId,
      noteId: id,
      role: 'user',
      content: message
    });
    
    // 获取AI回复
    let aiResponse;
    try {
      aiResponse = await aiService.chatWithNote(id, message, note.content);
    } catch (error: any) {
      if (error.message.includes('API key') || error.message.includes('401')) {
        aiResponse = "I'm sorry, but I need a valid OpenAI API key to respond. Please configure your API key in the server settings.";
      } else {
        aiResponse = "I'm sorry, I encountered an error while processing your request. Please try again.";
      }
    }
    
    // 保存AI回复
    const aiMessageId = uuidv4();
    const aiMessage = await db.createNoteChatMessage({
      id: aiMessageId,
      noteId: id,
      role: 'assistant',
      content: aiResponse
    });
    
    res.json({
      success: true,
      data: [userMessage, aiMessage]
    } as NoteChatResponse);
    
  } catch (error) {
    console.error('Note chat error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as NoteChatResponse);
  }
});

// 获取笔记聊天历史
router.get('/:id/chat', async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await db.getNoteChatMessages(id);
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get note chat messages error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as notesRouter };
