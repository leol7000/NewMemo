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
    oneLineSummary?: string;
    keyPoints?: string[];
    summaryZh?: string;
    oneLineSummaryZh?: string;
    keyPointsZh?: string[];
    summaryEsEu?: string;
    oneLineSummaryEsEu?: string;
    keyPointsEsEu?: string[];
    summaryPtEu?: string;
    oneLineSummaryPtEu?: string;
    keyPointsPtEu?: string[];
    summaryEsLatam?: string;
    oneLineSummaryEsLatam?: string;
    keyPointsEsLatam?: string[];
    summaryPtLatam?: string;
    oneLineSummaryPtLatam?: string;
    keyPointsPtLatam?: string[];
    summaryDe?: string;
    oneLineSummaryDe?: string;
    keyPointsDe?: string[];
    summaryFr?: string;
    oneLineSummaryFr?: string;
    keyPointsFr?: string[];
    summaryJa?: string;
    oneLineSummaryJa?: string;
    keyPointsJa?: string[];
    summaryTh?: string;
    oneLineSummaryTh?: string;
    keyPointsTh?: string[];
    type: 'website' | 'youtube';
    coverImage?: string;
    createdAt: string;
    updatedAt: string;
    metadata?: {
        author?: string;
        publishedDate?: string;
        duration?: string;
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
    coverImage?: string;
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
    metadata?: {
        duration?: string;
        thumbnail?: string;
        channel?: string;
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
//# sourceMappingURL=types.d.ts.map