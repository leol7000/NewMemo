// 共享类型定义

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  memo_count: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionMemo {
  id: string;
  collection_id: string;
  memo_id: string;
  createdAt: string;
  memo: MemoCard;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface AddMemoToCollectionRequest {
  collection_id: string;
  memo_id: string;
}

export type Language = 'en' | 'zh' | 'es-eu' | 'pt-eu' | 'es-latam' | 'pt-latam' | 'de' | 'fr' | 'ja' | 'th';

export interface MemoCard {
  id: string;
  url: string;
  title: string;
  summary: string;
  type: 'website' | 'youtube';
  status?: 'processing' | 'completed' | 'failed';
  oneLineSummary?: string; // 一句话总结
  keyPoints?: string[]; // 要点列表
  summaryZh?: string; // 中文总结
  oneLineSummaryZh?: string; // 中文一句话总结
  keyPointsZh?: string[]; // 中文要点列表
  summaryEsEu?: string; // 西班牙语(欧洲)总结
  oneLineSummaryEsEu?: string;
  keyPointsEsEu?: string[];
  summaryPtEu?: string; // 葡萄牙语(欧洲)总结
  oneLineSummaryPtEu?: string;
  keyPointsPtEu?: string[];
  summaryEsLatam?: string; // 西班牙语(拉丁美洲)总结
  oneLineSummaryEsLatam?: string;
  keyPointsEsLatam?: string[];
  summaryPtLatam?: string; // 葡萄牙语(拉丁美洲)总结
  oneLineSummaryPtLatam?: string;
  keyPointsPtLatam?: string[];
  summaryDe?: string; // 德语总结
  oneLineSummaryDe?: string;
  keyPointsDe?: string[];
  summaryFr?: string; // 法语总结
  oneLineSummaryFr?: string;
  keyPointsFr?: string[];
  summaryJa?: string; // 日语总结
  oneLineSummaryJa?: string;
  keyPointsJa?: string[];
  summaryTh?: string; // 泰语总结
  oneLineSummaryTh?: string;
  keyPointsTh?: string[];
  type: 'website' | 'youtube';
  coverImage?: string; // 封面图片URL
  createdAt: string;
  updatedAt: string;
  metadata?: {
    author?: string;
    publishedDate?: string;
    duration?: string; // for YouTube videos
    thumbnail?: string;
  };
}

export interface ChatMessage {
  id: string;
  memoId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface WebContent {
  title: string;
  content: string;
  url: string;
  coverImage?: string; // 封面图片URL
  metadata?: {
    author?: string;
    publishedDate?: string;
    description?: string;
  };
}

export interface YouTubeContent {
  title: string;
  transcript: string;
  url: string;
  coverImage?: string;
  metadata?: {
    duration?: string;
    thumbnail?: string;
    channel?: string;
    transcriptLanguage?: string;
  };
}

export interface SummarizeRequest {
  url: string;
  type: 'website' | 'youtube';
}

export interface SummarizeResponse {
  success: boolean;
  data?: MemoCard;
  error?: string;
}

export interface ChatRequest {
  memoId: string;
  message: string;
}

export interface ChatResponse {
  success: boolean;
  data?: ChatMessage;
  error?: string;
}

export interface GenerateLanguageRequest {
  memoId: string;
  language: Language;
}

export interface GenerateLanguageResponse {
  success: boolean;
  data?: {
    summary?: string;
    oneLineSummary?: string;
    keyPoints?: string[];
  };
  error?: string;
}
