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

  async summarizeYouTubeContent(content: YouTubeContent): Promise<{ summary: string; oneLineSummary: string; keyPoints: string[] }> {
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
