import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { WebScraper } from '../services/webScraper';
import { YouTubeScraperYtDlp } from '../services/youtubeScraperYtDlp';
import { AIService } from '../services/aiService';
import { Database } from '../database';
import { SummarizeRequest, SummarizeResponse } from '../../shared/types';

const router = Router();
const webScraper = new WebScraper();
const youtubeScraper = new YouTubeScraperYtDlp();
const aiService = new AIService();
const db = new Database();

// 初始化数据库
db.init().catch(console.error);

router.post('/', async (req, res) => {
  try {
    const { url, type }: SummarizeRequest = req.body;

    if (!url || !type) {
      return res.status(400).json({
        success: false,
        error: 'URL and type are required'
      } as SummarizeResponse);
    }

    // 先创建一个空的 memo 卡片
    const memoId = uuidv4();
    const emptyMemo = await db.createEmptyMemo({
      id: memoId,
      url,
      type,
      status: 'processing'
    });

    // 立即返回空卡片
    res.json({
      success: true,
      data: emptyMemo
    } as SummarizeResponse);

    // 异步处理内容抓取和 AI 总结
    processMemoAsync(memoId, url, type);

  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as SummarizeResponse);
  }
});

// 异步处理 memo 内容
async function processMemoAsync(memoId: string, url: string, type: 'website' | 'youtube') {
  try {
    let content;
    let aiResult;

    if (type === 'website') {
      // 抓取网页内容
      content = await webScraper.scrape(url);
      aiResult = await aiService.summarizeWebContent(content);
    } else if (type === 'youtube') {
      // 抓取YouTube内容
      console.log('Scraping YouTube content...');
      content = await youtubeScraper.scrape(url);
      console.log('YouTube content scraped successfully, transcript length:', content.transcript.length);
      console.log('Calling AI service for YouTube summarization...');
      aiResult = await aiService.summarizeYouTubeContent(content);
      console.log('AI summarization completed successfully');
    }

    // 更新 memo 内容
    await db.updateMemo(memoId, {
      title: content.title,
      summary: aiResult.summary,
      oneLineSummary: aiResult.oneLineSummary,
      keyPoints: aiResult.keyPoints,
      coverImage: content.coverImage,
      metadata: content.metadata,
      status: 'completed'
    });

    console.log(`Memo ${memoId} processing completed successfully`);

  } catch (error) {
    console.error(`Error processing memo ${memoId}:`, error);
    // 更新状态为失败
    await db.updateMemo(memoId, {
      status: 'failed',
      summary: 'Failed to process content. Please try again.'
    });
  }
}

export { router as summarizeRouter };
