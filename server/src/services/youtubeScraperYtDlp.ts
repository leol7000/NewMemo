const YTDlpWrap = require('yt-dlp-wrap');
import { YouTubeContent } from '../../shared/types';
import { SupabaseDatabase } from './supabaseDatabase';

export class YouTubeScraperYtDlp {
  private ytDlpWrap: any;
  private db: SupabaseDatabase;

  constructor() {
    // 设置yt-dlp的路径
    const ytDlpPath = process.env.YT_DLP_PATH || '/Users/leo/Library/Python/3.9/bin/yt-dlp';
    this.ytDlpWrap = new YTDlpWrap.default(ytDlpPath);
    this.db = new SupabaseDatabase();
  }

  // 检查memo是否还存在
  private async checkMemoExists(memoId: string): Promise<boolean> {
    if (!memoId) return true; // 如果没有memoId，继续处理
    try {
      const memo = await this.db.getMemo(memoId);
      return !!memo;
    } catch (error) {
      console.log(`Error checking memo ${memoId}:`, error);
      return false;
    }
  }

  async scrape(videoUrl: string, memoId?: string): Promise<YouTubeContent> {
    try {
      // 提取视频ID
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      console.log(`Attempting to get transcript for video: ${videoId}`);

      // 首先获取视频信息
      const videoInfoResult = await this.ytDlpWrap.exec([
        '--dump-json',
        '--no-download',
        videoUrl
      ]);
      
      console.log('yt-dlp exec result:', videoInfoResult);
      
      // yt-dlp-wrap 返回的是 EventEmitter，需要等待完成
      const videoInfoData = await new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        
        // 监听stdout数据
        videoInfoResult.ytDlpProcess.stdout.on('data', (data: any) => {
          stdout += data.toString();
        });
        
        // 监听stderr数据
        videoInfoResult.ytDlpProcess.stderr.on('data', (data: any) => {
          stderr += data.toString();
        });
        
        videoInfoResult.on('error', (error: any) => {
          reject(error);
        });
        
        videoInfoResult.on('close', (code: number) => {
          if (code === 0) {
            resolve(stdout);
          } else {
            reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
          }
        });
      });
      
      if (!videoInfoData) {
        throw new Error('Failed to get video info from yt-dlp');
      }
      
      const videoInfo = JSON.parse(videoInfoData as string);
      console.log('Video info retrieved:', videoInfo.title);
      console.log('Video thumbnail:', videoInfo.thumbnail);
      
      // 检查memo是否还存在
      if (memoId && !(await this.checkMemoExists(memoId))) {
        throw new Error(`Memo ${memoId} was deleted, stopping YouTube processing`);
      }

      // 检查视频可用的字幕语言
      const availableSubtitles = videoInfo.subtitles || {};
      const availableAutomaticCaptions = videoInfo.automatic_captions || {};
      
      console.log('Available subtitles:', Object.keys(availableSubtitles));
      console.log('Available automatic captions:', Object.keys(availableAutomaticCaptions));
      
      // 尝试获取字幕（支持多语言和自动生成）
      const tempDir = '/tmp';
      const tempFile = `${tempDir}/yt_transcript_${Date.now()}.%(ext)s`;
      
      try {
        // 优先使用视频实际可用的字幕语言
        const subtitleLanguages = [];
        
        // 添加可用的字幕语言（优先手动字幕）
        if (availableSubtitles.en) subtitleLanguages.push('en');
        if (availableSubtitles['zh-cn']) subtitleLanguages.push('zh-cn');
        if (availableSubtitles['zh-Hans']) subtitleLanguages.push('zh-Hans');
        if (availableSubtitles.zh) subtitleLanguages.push('zh');
        if (availableSubtitles['zh-tw']) subtitleLanguages.push('zh-tw');
        if (availableSubtitles['zh-TW']) subtitleLanguages.push('zh-TW');
        
        // 添加可用的自动字幕语言（如果没有手动字幕）
        if (subtitleLanguages.length === 0) {
          if (availableAutomaticCaptions.en) subtitleLanguages.push('en-auto');
          if (availableAutomaticCaptions['zh-cn']) subtitleLanguages.push('zh-cn-auto');
          if (availableAutomaticCaptions['zh-Hans']) subtitleLanguages.push('zh-Hans-auto');
          if (availableAutomaticCaptions.zh) subtitleLanguages.push('zh-auto');
        }
        
        // 如果还是没有找到，尝试通用语言
        if (subtitleLanguages.length === 0) {
          subtitleLanguages.push('en', 'zh', 'auto');
        }
        
        console.log('Will try subtitle languages:', subtitleLanguages);
        
        let subtitleResult = null;
        let foundSubtitle = false;
        
        for (const lang of subtitleLanguages) {
          try {
            console.log(`Trying to get subtitles for language: ${lang}`);
            
            // 检查memo是否还存在
            if (memoId && !(await this.checkMemoExists(memoId))) {
              throw new Error(`Memo ${memoId} was deleted during subtitle processing`);
            }
            
            // 添加延迟避免速率限制（减少延迟时间）
            if (lang !== subtitleLanguages[0]) {
              await new Promise(resolve => setTimeout(resolve, 500)); // 减少到0.5秒延迟
            }
            
            if (lang === 'auto') {
              // 尝试获取自动生成的字幕
              subtitleResult = await this.ytDlpWrap.exec([
                '--write-auto-sub',
                '--skip-download',
                '--output', tempFile,
                '--sleep-interval', '1', // 添加请求间隔
                videoUrl
              ]);
            } else if (lang.endsWith('-auto')) {
              // 尝试获取指定语言的自动字幕
              const baseLang = lang.replace('-auto', '');
              subtitleResult = await this.ytDlpWrap.exec([
                '--write-auto-sub',
                '--sub-lang', baseLang,
                '--skip-download',
                '--output', tempFile,
                '--sleep-interval', '1', // 添加请求间隔
                videoUrl
              ]);
            } else {
              // 尝试获取指定语言的字幕
              subtitleResult = await this.ytDlpWrap.exec([
                '--write-auto-sub',
                '--sub-lang', lang,
                '--skip-download',
                '--output', tempFile,
                '--sleep-interval', '1', // 添加请求间隔
                videoUrl
              ]);
            }

            console.log('yt-dlp subtitle result:', subtitleResult);

            // 等待字幕下载完成
            await new Promise((resolve, reject) => {
              let stderr = '';
              
              // 监听stderr数据
              subtitleResult.ytDlpProcess.stderr.on('data', (data: any) => {
                stderr += data.toString();
              });
              
              subtitleResult.on('error', (error: any) => {
                reject(error);
              });
              
              subtitleResult.on('close', (code: number) => {
                if (code === 0) {
                  resolve(true);
                } else {
                  reject(new Error(`yt-dlp subtitle extraction failed with code ${code}: ${stderr}`));
                }
              });
            });

            // 查找实际生成的文件
            const fs = require('fs');
            const files = fs.readdirSync(tempDir).filter((file: string) => file.startsWith('yt_transcript_'));
            console.log(`Found files after ${lang} subtitle attempt:`, files);
            
            if (files.length > 0) {
              foundSubtitle = true;
              console.log(`Successfully found subtitles for language: ${lang}`);
              break; // 找到字幕就退出循环
            }
            
          } catch (langError) {
            console.log(`Failed to get subtitles for language ${lang}:`, langError.message);
            // 继续尝试下一个语言
            continue;
          }
        }
        
        if (!foundSubtitle) {
          throw new Error('No subtitles available for this video. Please try a different video that has captions/subtitles enabled.');
        }
        
        // 获取最终的文件列表
        const fs = require('fs');
        const files = fs.readdirSync(tempDir).filter((file: string) => file.startsWith('yt_transcript_'));
        const actualFile = `${tempDir}/${files[0]}`;
        console.log('Reading file:', actualFile);
        const subtitleContent = fs.readFileSync(actualFile, 'utf8');
        
        // 解析 VTT 字幕
        const transcript = this.parseVTT(subtitleContent);
        
        // 清理临时文件
        fs.unlinkSync(actualFile);
        
        if (transcript.length === 0) {
          throw new Error('No transcript content found');
        }

        console.log(`Successfully got transcript with ${transcript.length} items`);
        console.log('Returning YouTube content with coverImage:', videoInfo.thumbnail);

        return {
          title: videoInfo.title || `YouTube Video ${videoId}`,
          transcript: transcript.join(' '),
          url: videoUrl,
          coverImage: videoInfo.thumbnail,
          metadata: {
            duration: videoInfo.duration_string,
            thumbnail: videoInfo.thumbnail,
            channel: videoInfo.uploader,
            transcriptLanguage: 'en'
          }
        };

      } catch (subError) {
        console.log('Subtitle extraction failed:', subError.message);
        if (subError.message.includes('No subtitles available')) {
          throw new Error('No subtitles available for this video. Please try a different video that has captions/subtitles enabled.');
        }
        throw new Error('Failed to extract subtitles. Please try a different video that has captions/subtitles enabled.');
      }

    } catch (error) {
      console.error('YouTube scraping error:', error);
      if (error.message.includes('No subtitles available') || error.message.includes('No transcript')) {
        throw new Error('No subtitles available for this video. Please try a different video that has captions/subtitles enabled.');
      }
      throw new Error(`Failed to scrape YouTube video: ${error.message}. Please try a different video that has captions/subtitles enabled.`);
    }
  }

  private parseVTT(content: string): string[] {
    const lines = content.split('\n');
    const transcript: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 跳过 WEBVTT 头部和时间戳行
      if (line.startsWith('WEBVTT') || 
          line.includes('-->') || 
          line === '' ||
          line.startsWith('Kind:') ||
          line.startsWith('Language:')) {
        continue;
      }
      
      // 提取文本内容，移除 HTML 标签
      if (line && !line.startsWith('NOTE')) {
        const cleanText = line.replace(/<[^>]*>/g, '').trim();
        if (cleanText) {
          transcript.push(cleanText);
        }
      }
    }
    
    return transcript;
  }

  private extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }
}
