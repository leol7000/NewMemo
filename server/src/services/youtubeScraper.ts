import { YoutubeTranscript } from 'youtube-transcript';
import youtubeDl from 'youtube-dl-exec';
import { YouTubeContent } from '../../shared/types';

export class YouTubeScraper {
  async scrape(videoUrl: string): Promise<YouTubeContent> {
    try {
      // 提取视频ID
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // 尝试多种方式获取字幕
      let transcript = null;
      let usedLanguage = '';

      // 首先尝试不指定语言（获取任何可用语言）
      try {
        transcript = await YoutubeTranscript.fetchTranscript(videoId);
        usedLanguage = 'auto';
        console.log('Got transcript without language specification');
      } catch (error) {
        console.log('Failed to get transcript without language specification, trying specific languages...');
        
        // 如果失败，尝试特定语言
        const languages = ['zh-CN', 'zh-Hans', 'zh', 'en'];
        for (const lang of languages) {
          try {
            transcript = await YoutubeTranscript.fetchTranscript(videoId, {
              lang: lang
            });
            usedLanguage = lang;
            console.log(`Successfully got transcript in language: ${lang}`);
            break;
          } catch (langError) {
            console.log(`Failed to get transcript in ${lang}, trying next language...`);
            continue;
          }
        }
      }

      if (!transcript || transcript.length === 0) {
        // 尝试使用 youtube-dl-exec 作为备用方案
        console.log('Trying youtube-dl-exec as fallback...');
        try {
          const result = await youtubeDl(videoUrl, {
            dumpSingleJson: true,
            skipDownload: true,
            writeSubtitles: false,
            writeAutoSub: false,
            listSubs: true
          });
          
          if (result && result.subtitles) {
            console.log('Found subtitles with youtube-dl:', Object.keys(result.subtitles));
            // 这里可以进一步处理字幕，但为了简化，我们继续使用原来的方法
          }
        } catch (dlError) {
          console.log('youtube-dl-exec also failed:', dlError.message);
        }
        
        throw new Error('No transcript available for this video in any supported language');
      }

      // 合并脚本文本
      const transcriptText = transcript
        .map(item => item.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!transcriptText) {
        throw new Error('No transcript available for this video');
      }

      console.log(`Successfully got transcript in language: ${usedLanguage}, ${transcript.length} items`);

      // 获取视频信息
      const videoInfo = await this.getVideoInfo(videoId);

      return {
        title: videoInfo.title,
        transcript: transcriptText,
        url: videoUrl,
        metadata: {
          duration: videoInfo.duration,
          thumbnail: videoInfo.thumbnail,
          channel: videoInfo.channel,
          transcriptLanguage: usedLanguage
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

  private async getVideoInfo(videoId: string): Promise<{
    title: string;
    duration?: string;
    thumbnail?: string;
    channel?: string;
  }> {
    try {
      // 这里可以使用YouTube Data API获取更详细的信息
      // 为了简化，我们返回基本信息
      return {
        title: `YouTube Video ${videoId}`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        duration: undefined,
        channel: undefined
      };
    } catch (error) {
      return {
        title: `YouTube Video ${videoId}`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      };
    }
  }
}
