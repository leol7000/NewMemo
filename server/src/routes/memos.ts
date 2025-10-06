import { Router } from 'express';
import { Database } from '../database';
import { AIService } from '../services/aiService';
import { GenerateLanguageRequest, GenerateLanguageResponse } from '../../shared/types';

const router = Router();
const db = new Database();
const aiService = new AIService();

// 初始化数据库
db.init().catch(console.error);

// 获取所有备忘录
router.get('/', async (req, res) => {
  try {
    const memos = await db.getAllMemos();
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
    const memo = await db.getMemo(id);
    
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
    
    const memo = await db.getMemo(id);
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
