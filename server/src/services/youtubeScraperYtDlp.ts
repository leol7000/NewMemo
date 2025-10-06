import { exec } from 'child_process';
import { promisify } from 'util';
import { YouTubeContent } from '../../shared/types';

const execAsync = promisify(exec);

export class YouTubeScraperYtDlp {
  async scrape(videoUrl: string): Promise<YouTubeContent> {
    try {
      // 提取视频ID
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      console.log(`Attempting to get transcript for video: ${videoId}`);

      // 首先获取视频信息
      const infoCommand = `yt-dlp --dump-json --no-download "${videoUrl}"`;
      const { stdout: infoOutput } = await execAsync(infoCommand);
      const videoInfo = JSON.parse(infoOutput);

      console.log('Video info retrieved:', videoInfo.title);

      // 尝试获取英文字幕
      const tempDir = '/tmp';
      const tempFile = `${tempDir}/yt_transcript_${Date.now()}.%(ext)s`;
      
      try {
        const subCommand = `yt-dlp --write-auto-sub --sub-lang en --skip-download --output "${tempFile}" "${videoUrl}"`;
        console.log('Executing command:', subCommand);
        const { stdout, stderr } = await execAsync(subCommand);
        console.log('yt-dlp stdout:', stdout);
        console.log('yt-dlp stderr:', stderr);
        
        // 查找实际生成的文件
        const fs = require('fs');
        const files = fs.readdirSync(tempDir).filter((file: string) => file.startsWith('yt_transcript_'));
        console.log('Found files:', files);
        
        if (files.length === 0) {
          throw new Error('No subtitle file was created');
        }
        
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

        return {
          title: videoInfo.title || `YouTube Video ${videoId}`,
          transcript: transcript.join(' '),
          url: videoUrl,
          metadata: {
            duration: videoInfo.duration,
            thumbnail: videoInfo.thumbnail,
            channel: videoInfo.uploader,
            transcriptLanguage: 'en'
          }
        };

      } catch (subError) {
        console.log('Subtitle extraction failed:', subError.message);
        throw new Error('No transcript available for this video. Please try a different video that has captions/subtitles enabled.');
      }

    } catch (error) {
      console.error('YouTube scraping error:', error);
      throw new Error(`Failed to scrape YouTube video: ${error}. Please try a different video that has captions/subtitles enabled.`);
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
