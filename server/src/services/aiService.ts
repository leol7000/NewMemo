import OpenAI from 'openai';
import dotenv from 'dotenv';
import { WebContent, YouTubeContent, Language } from '../../shared/types';

// Ensure environment variables are loaded before using them anywhere in this module
dotenv.config();

export class AIService {
  private openai: OpenAI | null = null;

  private getClient(): OpenAI {
    if (this.openai) return this.openai;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('缺少 OPENAI_API_KEY，请在 server/.env 中配置后重启服务');
    }
    this.openai = new OpenAI({ apiKey });
    return this.openai;
  }

  async summarizeWebContent(content: WebContent): Promise<{ summary: string; oneLineSummary: string; keyPoints: string[] }> {
    const model = process.env.OPENAI_MODEL_SUMMARY || 'gpt-4o';
    const summaryTemperature = process.env.OPENAI_TEMPERATURE_SUMMARY
      ? parseFloat(process.env.OPENAI_TEMPERATURE_SUMMARY)
      : (process.env.OPENAI_TEMPERATURE ? parseFloat(process.env.OPENAI_TEMPERATURE) : 0.3);
    const summaryPrompt = `Please generate a comprehensive English summary for the following web content with these requirements:
1. Keep the summary between 200-300 words
2. Highlight the main content points
3. Use clear and structured language
4. Maintain an objective and neutral tone

Web Title: ${content.title}
Web URL: ${content.url}
Web Content: ${content.content.substring(0, 8000)}`;

    const oneLinePrompt = `Please generate a single sentence summary (maximum 20 words) for the following web content:

Web Title: ${content.title}
Web URL: ${content.url}
Web Content: ${content.content.substring(0, 8000)}`;

    const keyPointsPrompt = `Please extract 3-5 key points from the following web content. Each key point should be a concise sentence (maximum 15 words). Return them as a numbered list:

Web Title: ${content.title}
Web URL: ${content.url}
Web Content: ${content.content.substring(0, 8000)}`;

    try {
      const [summaryResponse, oneLineResponse, keyPointsResponse] = await Promise.all([
        this.getClient().chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional content summarization assistant, skilled at distilling long text content into concise and clear summaries.'
            },
            {
              role: 'user',
              content: summaryPrompt
            }
          ],
          max_tokens: 500,
          temperature: summaryTemperature
        }),
        this.getClient().chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional content summarization assistant, skilled at creating concise one-line summaries.'
            },
            {
              role: 'user',
              content: oneLinePrompt
            }
          ],
          max_tokens: 50,
          temperature: summaryTemperature
        }),
        this.getClient().chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional content analysis assistant, skilled at extracting key points from text content.'
            },
            {
              role: 'user',
              content: keyPointsPrompt
            }
          ],
          max_tokens: 200,
          temperature: summaryTemperature
        })
      ]);

      const summary = summaryResponse.choices[0]?.message?.content || 'Unable to generate summary';
      const oneLineSummary = oneLineResponse.choices[0]?.message?.content || 'Unable to generate one-line summary';
      
      // Parse key points from the response
      const keyPointsText = keyPointsResponse.choices[0]?.message?.content || '';
      const keyPoints = keyPointsText
        .split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 5); // Limit to 5 key points

      return {
        summary,
        oneLineSummary,
        keyPoints
      };
    } catch (error) {
      throw new Error(`AI summarization failed: ${error}`);
    }
  }

  async summarizeNoteContent(content: string): Promise<{ summary: string; oneLineSummary: string; keyPoints: string[] }> {
    try {
      // 清理 HTML 内容，提取纯文本
      const textContent = this.extractTextFromHtml(content);
      
      const prompt = `Please analyze the following note content and provide:

1. A comprehensive summary (2-3 paragraphs)
2. A one-line summary (1 sentence)
3. Key points (3-5 bullet points)

Note content:
${textContent}

Please respond in JSON format:
{
  "summary": "comprehensive summary here",
  "oneLineSummary": "one line summary here",
  "keyPoints": ["key point 1", "key point 2", "key point 3"]
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      try {
        const result = JSON.parse(content);
        return {
          summary: result.summary || 'No summary available',
          oneLineSummary: result.oneLineSummary || 'No summary available',
          keyPoints: result.keyPoints || []
        };
      } catch (parseError) {
        // 如果 JSON 解析失败，尝试提取信息
        return {
          summary: content,
          oneLineSummary: content.split('.')[0] + '.',
          keyPoints: content.split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-\s*/, ''))
        };
      }
    } catch (error) {
      console.error('Error summarizing note content:', error);
      throw error;
    }
  }

  async chatWithNote(noteId: string, message: string, noteContent: string): Promise<string> {
    try {
      const textContent = this.extractTextFromHtml(noteContent);
      
      const prompt = `You are an AI assistant helping with a note. The user can ask questions about the note content or request operations on the note.

Note content:
${textContent}

User message: ${message}

Please provide a helpful response. If the user asks to modify the note, explain what changes you would make but note that you cannot directly edit the note - the user would need to make those changes manually.

Respond in a conversational, helpful manner.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
    } catch (error) {
      console.error('Error in note chat:', error);
      throw error;
    }
  }

  private extractTextFromHtml(html: string): string {
    // 简单的 HTML 标签移除
    return html
      .replace(/<[^>]*>/g, '') // 移除所有 HTML 标签
      .replace(/&nbsp;/g, ' ') // 替换 &nbsp;
      .replace(/&amp;/g, '&') // 替换 &amp;
      .replace(/&lt;/g, '<') // 替换 &lt;
      .replace(/&gt;/g, '>') // 替换 &gt;
      .replace(/&quot;/g, '"') // 替换 &quot;
      .replace(/\s+/g, ' ') // 合并多个空格
      .trim();
  }

  async summarizeYouTubeContent(content: YouTubeContent, memoId?: string): Promise<{ summary: string; oneLineSummary: string; keyPoints: string[] }> {
    try {
      const model = process.env.OPENAI_MODEL_SUMMARY || 'gpt-4o';
      const summaryTemperature = process.env.OPENAI_TEMPERATURE_SUMMARY
        ? parseFloat(process.env.OPENAI_TEMPERATURE_SUMMARY)
        : (process.env.OPENAI_TEMPERATURE ? parseFloat(process.env.OPENAI_TEMPERATURE) : 0.3);
      const summaryPrompt = `Please generate a comprehensive English summary for the following YouTube video transcript with these requirements:
1. Keep the summary between 200-300 words
2. Highlight the main points and key content
3. Use clear and structured language
4. Maintain an objective and neutral tone

Video Title: ${content.title}
Video URL: ${content.url}
Video Transcript: ${content.transcript.substring(0, 8000)}`;

    const oneLinePrompt = `Please generate a single sentence summary (maximum 20 words) for the following YouTube video:

Video Title: ${content.title}
Video URL: ${content.url}
Video Transcript: ${content.transcript.substring(0, 8000)}`;

    const keyPointsPrompt = `Please extract 3-5 key points from the following YouTube video transcript. Each key point should be a concise sentence (maximum 15 words). Return them as a numbered list:

Video Title: ${content.title}
Video URL: ${content.url}
Video Transcript: ${content.transcript.substring(0, 8000)}`;

    try {
      const [summaryResponse, oneLineResponse, keyPointsResponse] = await Promise.all([
        this.getClient().chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional video content summarization assistant, skilled at distilling video transcripts into concise and clear summaries.'
            },
            {
              role: 'user',
              content: summaryPrompt
            }
          ],
          max_tokens: 500,
          temperature: summaryTemperature
        }),
        this.getClient().chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional video content summarization assistant, skilled at creating concise one-line summaries.'
            },
            {
              role: 'user',
              content: oneLinePrompt
            }
          ],
          max_tokens: 50,
          temperature: summaryTemperature
        }),
        this.getClient().chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional video content analysis assistant, skilled at extracting key points from video transcripts.'
            },
            {
              role: 'user',
              content: keyPointsPrompt
            }
          ],
          max_tokens: 200,
          temperature: summaryTemperature
        })
      ]);

      const summary = summaryResponse.choices[0]?.message?.content || 'Unable to generate summary';
      const oneLineSummary = oneLineResponse.choices[0]?.message?.content || 'Unable to generate one-line summary';
      
      // Parse key points from the response
      const keyPointsText = keyPointsResponse.choices[0]?.message?.content || '';
      const keyPoints = keyPointsText
        .split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 5); // Limit to 5 key points

      return {
        summary,
        oneLineSummary,
        keyPoints
      };
    } catch (error) {
      throw new Error(`AI summarization failed: ${error}`);
    }
  }

  async generateLanguageSummary(content: string, language: Language): Promise<{ summary: string; oneLineSummary: string; keyPoints: string[] }> {
    const model = process.env.OPENAI_MODEL_SUMMARY || 'gpt-4o';
    const summaryTemperature = process.env.OPENAI_TEMPERATURE_SUMMARY
      ? parseFloat(process.env.OPENAI_TEMPERATURE_SUMMARY)
      : (process.env.OPENAI_TEMPERATURE ? parseFloat(process.env.OPENAI_TEMPERATURE) : 0.3);

    const languageConfig = this.getLanguageConfig(language);
    const langCode = languageConfig.name;
    const langInstruction = languageConfig.instruction;

    const summaryPrompt = `${langInstruction} generate a comprehensive ${langCode} summary for the following content with these requirements:
1. Keep the summary between 200-300 words
2. Highlight the main content points
3. Use clear and structured language
4. Maintain an objective and neutral tone

Content: ${content.substring(0, 8000)}`;

    const oneLinePrompt = `${langInstruction} generate a single sentence summary (maximum 20 words) for the following content:

Content: ${content.substring(0, 8000)}`;

    const keyPointsPrompt = `${langInstruction} extract 3-5 key points from the following content. Each key point should be a concise sentence (maximum 15 words). Return them as a numbered list:

Content: ${content.substring(0, 8000)}`;

    try {
      const [summaryResponse, oneLineResponse, keyPointsResponse] = await Promise.all([
        this.getClient().chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: `You are a professional content summarization assistant, skilled at distilling long text content into concise and clear summaries in ${langCode}.`
            },
            {
              role: 'user',
              content: summaryPrompt
            }
          ],
          max_tokens: 500,
          temperature: summaryTemperature
        }),
        this.getClient().chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: `You are a professional content summarization assistant, skilled at creating concise one-line summaries in ${langCode}.`
            },
            {
              role: 'user',
              content: oneLinePrompt
            }
          ],
          max_tokens: 50,
          temperature: summaryTemperature
        }),
        this.getClient().chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: `You are a professional content analysis assistant, skilled at extracting key points from text content in ${langCode}.`
            },
            {
              role: 'user',
              content: keyPointsPrompt
            }
          ],
          max_tokens: 200,
          temperature: summaryTemperature
        })
      ]);

      const summary = summaryResponse.choices[0]?.message?.content || `Unable to generate ${langCode} summary`;
      const oneLineSummary = oneLineResponse.choices[0]?.message?.content || `Unable to generate ${langCode} one-line summary`;
      
      const keyPointsText = keyPointsResponse.choices[0]?.message?.content || '';
      const keyPoints = keyPointsText
        .split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 5);

      return {
        summary,
        oneLineSummary,
        keyPoints
      };
    } catch (error) {
      throw new Error(`AI ${langCode} summarization failed: ${error}`);
    }
  }

  private getLanguageConfig(language: Language): { name: string; instruction: string } {
    const configs = {
      'en': { name: 'English', instruction: 'Please use English' },
      'zh': { name: 'Chinese', instruction: '请用中文' },
      'es-eu': { name: 'European Spanish', instruction: 'Por favor usa español europeo' },
      'pt-eu': { name: 'European Portuguese', instruction: 'Por favor usa português europeu' },
      'es-latam': { name: 'Latin American Spanish', instruction: 'Por favor usa español latinoamericano' },
      'pt-latam': { name: 'Latin American Portuguese', instruction: 'Por favor usa português latinoamericano' },
      'de': { name: 'German', instruction: 'Bitte verwende Deutsch' },
      'fr': { name: 'French', instruction: 'Veuillez utiliser le français' },
      'ja': { name: 'Japanese', instruction: '日本語を使用してください' },
      'th': { name: 'Thai', instruction: 'กรุณาใช้ภาษาไทย' }
    };
    
    return configs[language];
  }

  async chat(memoId: string, message: string, memoContent: string): Promise<string> {
    const prompt = `Based on the following summary content, answer the user's question. If the question goes beyond the scope of the summary content, please politely explain.

Summary Content: ${memoContent}
User Question: ${message}`;

    try {
      const model = process.env.OPENAI_MODEL_CHAT || process.env.OPENAI_MODEL || 'gpt-5';
      // Force temperature 1 for gpt-5 as requested
      let temperature = 1;
      if (!String(model).includes('gpt-5')) {
        temperature = (process.env.OPENAI_TEMPERATURE_CHAT
          ? parseFloat(process.env.OPENAI_TEMPERATURE_CHAT)
          : (process.env.OPENAI_TEMPERATURE ? parseFloat(process.env.OPENAI_TEMPERATURE) : 0.7));
      }
      const maxTokens = process.env.OPENAI_MAX_TOKENS_CHAT ? parseInt(process.env.OPENAI_MAX_TOKENS_CHAT, 10) : 1000;

      // First attempt with max_tokens
      try {
        const response = await this.getClient().chat.completions.create({
          model,
          messages: [
            { role: 'system', content: 'You are an intelligent assistant that answers user questions based on the provided summary content. If the question goes beyond the content scope, please politely explain.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: maxTokens,
          temperature
        } as any);
        return response.choices[0]?.message?.content || 'Sorry, I cannot answer this question.';
      } catch (err: any) {
        const msg = String(err?.message || '').toLowerCase();
        // Retry with alternative param name if API expects max_output_tokens
        if (msg.includes('max_output_tokens') || msg.includes('unrecognized') || msg.includes('unknown field')) {
          const response = await (this.getClient().chat.completions.create as any)({
            model,
            messages: [
              { role: 'system', content: 'You are an intelligent assistant that answers user questions based on the provided summary content. If the question goes beyond the content scope, please politely explain.' },
              { role: 'user', content: prompt }
            ],
            max_output_tokens: maxTokens,
            temperature
          });
          return response.choices[0]?.message?.content || 'Sorry, I cannot answer this question.';
        }
        throw err;
      }
    } catch (error) {
      throw new Error(`AI chat failed: ${error}`);
    }
  }
}
