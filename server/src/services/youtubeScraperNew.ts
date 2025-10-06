import YTDlpWrap from 'yt-dlp-wrap';
import { YouTubeContent } from '../../shared/types';

export class YouTubeScraperNew {
  private ytDlpWrap: YTDlpWrap;

  constructor() {
    this.ytDlpWrap = new YTDlpWrap();
  }

  async scrape(videoUrl: string): Promise<YouTubeContent> {
    try {
      // 提取视频ID
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      console.log(`Attempting to get transcript for video: ${videoId}`);

      // 使用 yt-dlp 获取视频信息
      const videoInfo = await this.ytDlpWrap.exec([
        videoUrl,
        '--dump-json',
        '--no-download'
      ]);

      const info = JSON.parse(videoInfo);
      console.log('Video info retrieved:', info.title);

      // 尝试获取字幕
      try {
        const subtitleResult = await this.ytDlpWrap.exec([
          videoUrl,
          '--write-sub',
          '--write-auto-sub',
          '--sub-lang', 'en,zh,zh-CN,zh-Hans',
          '--skip-download',
          '--output', '/tmp/%(title)s.%(ext)s'
        ]);

        console.log('Subtitle extraction result:', subtitleResult);
      } catch (subError) {
        console.log('Subtitle extraction failed:', subError.message);
      }

      // 尝试获取自动生成的字幕
      try {
        const autoSubResult = await this.ytDlpWrap.exec([
          videoUrl,
          '--write-auto-sub',
          '--sub-lang', 'en',
          '--skip-download',
          '--output', '/tmp/%(title)s.%(ext)s'
        ]);

        console.log('Auto subtitle extraction result:', autoSubResult);
      } catch (autoSubError) {
        console.log('Auto subtitle extraction failed:', autoSubError.message);
      }

      // 暂时返回基本信息，即使没有字幕
      return {
        title: info.title || `YouTube Video ${videoId}`,
        transcript: 'Transcript extraction is being improved. Please try again later or use a different video.',
        url: videoUrl,
        metadata: {
          duration: info.duration,
          thumbnail: info.thumbnail,
          channel: info.uploader,
          transcriptLanguage: 'auto'
        }
      };

    } catch (error) {
      console.error('YouTube scraping error:', error);
      throw new Error(`Failed to scrape YouTube video: ${error}. Please try a different video that has captions/subtitles enabled.`);
    }
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
