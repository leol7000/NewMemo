import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { WebContent } from '../../shared/types';

export class WebScraper {
  private browser: puppeteer.Browser | null = null;

  async init(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
  }

  async scrape(url: string): Promise<WebContent> {
    try {
      if (!this.browser) {
        await this.init();
      }

      const page = await this.browser!.newPage();
      
      try {
        // 设置用户代理
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // 访问页面
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // 获取页面内容
        const content = await page.content();
        const $ = cheerio.load(content);
        
        // 提取标题
        let title = $('title').text() || 
                    $('h1').first().text() || 
                    $('meta[property="og:title"]').attr('content') ||
                    'Untitled';
        
        // 清理标题
        title = title.trim().replace(/\s+/g, ' ');
        
        // 移除不需要的元素
        $('script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar').remove();
        
        // 提取主要内容
        const mainContent = this.extractMainContent($);
        
        // 提取封面图片
        const coverImage = this.extractCoverImage($, url);
        
        // 提取元数据
        const metadata = {
          author: $('meta[name="author"]').attr('content') || 
                  $('[rel="author"]').text() ||
                  $('.author').first().text(),
          publishedDate: $('meta[property="article:published_time"]').attr('content') ||
                        $('time[datetime]').attr('datetime') ||
                        $('.published-date').first().text(),
          description: $('meta[name="description"]').attr('content') ||
                      $('meta[property="og:description"]').attr('content')
        };

        await page.close();
        
        return {
          title,
          content: mainContent,
          url,
          coverImage,
          metadata: Object.values(metadata).some(v => v) ? metadata : undefined
        };
        
      } catch (error) {
        await page.close();
        throw new Error(`Failed to scrape ${url}: ${error}`);
      }
    } catch (error) {
      // 如果Puppeteer失败，尝试简单的fetch方法
      console.warn('Puppeteer failed, trying fetch method:', error);
      return this.fallbackScrape(url);
    }
  }

  private extractMainContent($: cheerio.CheerioAPI): string {
    // 尝试找到主要内容区域
    const contentSelectors = [
      'article',
      'main',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '#content',
      '.main-content'
    ];

    let mainElement: cheerio.Cheerio<cheerio.Element> | null = null;
    
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        mainElement = element;
        break;
      }
    }

    if (!mainElement) {
      // 如果没有找到特定的内容区域，使用body
      mainElement = $('body');
    }

    // 提取文本内容
    let text = mainElement.text();
    
    // 清理文本
    text = text
      .replace(/\s+/g, ' ') // 合并多个空白字符
      .replace(/\n\s*\n/g, '\n') // 移除多余的空行
      .trim();

    // 限制长度
    if (text.length > 10000) {
      text = text.substring(0, 10000) + '...';
    }

    return text;
  }

  private async fallbackScrape(url: string): Promise<WebContent> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // 提取标题
      let title = $('title').text() || 
                  $('h1').first().text() || 
                  $('meta[property="og:title"]').attr('content') ||
                  'Untitled';
      
      // 清理标题
      title = title.trim().replace(/\s+/g, ' ');
      
      // 移除不需要的元素
      $('script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar').remove();
      
      // 提取主要内容
      const mainContent = this.extractMainContent($);
      
      // 提取封面图片
      const coverImage = this.extractCoverImage($, url);
      
      return {
        title,
        content: mainContent,
        url,
        coverImage
      };
    } catch (error) {
      throw new Error(`Fallback scrape failed for ${url}: ${error}`);
    }
  }

  private extractCoverImage($: cheerio.CheerioAPI, baseUrl: string): string | undefined {
    const images: string[] = [];
    
    // 提取各种可能的图片选择器
    const selectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'meta[name="twitter:image:src"]',
      'link[rel="apple-touch-icon"]',
      'img[src]',
      'img[data-src]',
      'img[data-lazy-src]'
    ];
    
    selectors.forEach(selector => {
      $(selector).each((_, element) => {
        let src = '';
        
        if (element.tagName === 'img') {
          src = $(element).attr('src') || 
                $(element).attr('data-src') || 
                $(element).attr('data-lazy-src') || '';
        } else if (element.tagName === 'meta') {
          src = $(element).attr('content') || '';
        } else if (element.tagName === 'link') {
          src = $(element).attr('href') || '';
        }
        
        if (src) {
          // 转换为绝对URL
          try {
            const absoluteUrl = new URL(src, baseUrl).href;
            images.push(absoluteUrl);
          } catch (e) {
            // 忽略无效URL
          }
        }
      });
    });
    
    // 选择最佳封面图片
    return this.selectBestCoverImage(images);
  }

  private selectBestCoverImage(images: string[]): string | undefined {
    if (images.length === 0) return undefined;
    
    // 优先选择Open Graph图片
    const ogImage = images.find(img => 
      img.includes('og:image') || 
      img.includes('facebook') ||
      img.includes('twitter')
    );
    if (ogImage) return ogImage;
    
    // 过滤掉太小的图片和图标
    const validImages = images.filter(img => {
      const url = img.toLowerCase();
      return !url.includes('icon') && 
             !url.includes('logo') && 
             !url.includes('avatar') &&
             !url.includes('favicon') &&
             !url.includes('apple-touch') &&
             url.match(/\.(jpg|jpeg|png|webp|gif)$/);
    });
    
    if (validImages.length > 0) {
      return validImages[0];
    }
    
    return images[0];
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
