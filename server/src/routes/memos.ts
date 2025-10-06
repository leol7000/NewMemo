import { Router } from 'express';
import { SupabaseDatabase } from '../services/supabaseDatabase';
import { AIService } from '../services/aiService';
import { optionalAuth } from '../middleware/auth';
import { GenerateLanguageRequest, GenerateLanguageResponse } from '../../shared/types';

const router = Router();
const db = new SupabaseDatabase();
const aiService = new AIService();

// 初始化数据库
db.init().catch(console.error);

// 测试认证端点
router.get('/test-auth', async (req: any, res) => {
  try {
    const userId = req.user?.sub;
    res.json({
      success: true,
      message: 'Authentication working',
      userId: userId,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取所有备忘录 - 临时禁用认证
router.get('/', async (req: any, res) => {
  try {
    const userId = req.user?.sub;
    console.log('Getting memos for user:', userId);
    
    // 如果没有用户ID，返回空数组
    if (!userId) {
      console.log('No user ID provided, returning empty array');
      return res.json({
        success: true,
        data: []
      });
    }
    
    const memos = await db.getAllMemos(userId);
    res.json({
      success: true,
      data: memos
    });
  } catch (error) {
    console.error('Get memos error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取单个备忘录
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // 暂时通过getAllMemos获取单个memo
    const memos = await db.getAllMemos();
    const memo = memos.find(m => m.id === id);
    
    if (!memo) {
      return res.status(404).json({
        success: false,
        error: 'Memo not found'
      });
    }

    res.json({
      success: true,
      data: memo
    });
  } catch (error) {
    console.error('Get memo error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 更新备忘录
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { summary, oneLineSummary, keyPoints, summaryZh, oneLineSummaryZh, keyPointsZh } = req.body;
    
    const updates: any = {};
    if (summary !== undefined) updates.summary = summary;
    if (oneLineSummary !== undefined) updates.oneLineSummary = oneLineSummary;
    if (keyPoints !== undefined) updates.keyPoints = keyPoints;
    if (summaryZh !== undefined) updates.summaryZh = summaryZh;
    if (oneLineSummaryZh !== undefined) updates.oneLineSummaryZh = oneLineSummaryZh;
    if (keyPointsZh !== undefined) updates.keyPointsZh = keyPointsZh;
    
    const updatedMemo = await db.updateMemo(id, updates);
    
    if (!updatedMemo) {
      return res.status(404).json({
        success: false,
        error: 'Memo not found'
      });
    }

    res.json({
      success: true,
      data: updatedMemo
    });
  } catch (error) {
    console.error('Update memo error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 生成指定语言的总结
router.post('/:id/generate-language', async (req, res) => {
  try {
    const { id } = req.params;
    const { language }: GenerateLanguageRequest = req.body;
    
    if (!language || !['zh', 'en', 'es-eu', 'pt-eu', 'es-latam', 'pt-latam', 'de', 'fr', 'ja', 'th'].includes(language)) {
      return res.status(400).json({
        success: false,
        error: 'Language must be one of: zh, en, es-eu, pt-eu, es-latam, pt-latam, de, fr, ja, th'
      } as GenerateLanguageResponse);
    }
    
    const memos = await db.getAllMemos();
    const memo = memos.find(m => m.id === id);
    if (!memo) {
      return res.status(404).json({
        success: false,
        error: 'Memo not found'
      } as GenerateLanguageResponse);
    }
    
    // 使用原始总结内容作为输入
    const content = memo.summary;
    const result = await aiService.generateLanguageSummary(content, language);
    
    // 更新数据库
    const updates: any = {};
    const fieldMappings = {
      'en': { summary: 'summary', oneLineSummary: 'oneLineSummary', keyPoints: 'keyPoints' },
      'zh': { summary: 'summaryZh', oneLineSummary: 'oneLineSummaryZh', keyPoints: 'keyPointsZh' },
      'es-eu': { summary: 'summaryEsEu', oneLineSummary: 'oneLineSummaryEsEu', keyPoints: 'keyPointsEsEu' },
      'pt-eu': { summary: 'summaryPtEu', oneLineSummary: 'oneLineSummaryPtEu', keyPoints: 'keyPointsPtEu' },
      'es-latam': { summary: 'summaryEsLatam', oneLineSummary: 'oneLineSummaryEsLatam', keyPoints: 'keyPointsEsLatam' },
      'pt-latam': { summary: 'summaryPtLatam', oneLineSummary: 'oneLineSummaryPtLatam', keyPoints: 'keyPointsPtLatam' },
      'de': { summary: 'summaryDe', oneLineSummary: 'oneLineSummaryDe', keyPoints: 'keyPointsDe' },
      'fr': { summary: 'summaryFr', oneLineSummary: 'oneLineSummaryFr', keyPoints: 'keyPointsFr' },
      'ja': { summary: 'summaryJa', oneLineSummary: 'oneLineSummaryJa', keyPoints: 'keyPointsJa' },
      'th': { summary: 'summaryTh', oneLineSummary: 'oneLineSummaryTh', keyPoints: 'keyPointsTh' }
    };
    
    const fields = fieldMappings[language];
    updates[fields.summary] = result.summary;
    updates[fields.oneLineSummary] = result.oneLineSummary;
    updates[fields.keyPoints] = result.keyPoints;
    
    const updatedMemo = await db.updateMemo(id, updates);
    
    res.json({
      success: true,
      data: {
        summary: result.summary,
        oneLineSummary: result.oneLineSummary,
        keyPoints: result.keyPoints
      }
    } as GenerateLanguageResponse);
    
  } catch (error) {
    console.error('Generate language summary error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as GenerateLanguageResponse);
  }
});

// 删除备忘录
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteMemo(id);
    
    res.json({
      success: true,
      message: 'Memo deleted successfully'
    });
  } catch (error) {
    console.error('Delete memo error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as memosRouter };
