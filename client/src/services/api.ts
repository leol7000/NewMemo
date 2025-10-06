import axios from 'axios';
import { MemoCard, ChatMessage, SummarizeRequest, ChatRequest, Collection, CollectionMemo, CreateCollectionRequest, AddMemoToCollectionRequest, GenerateLanguageResponse, Language } from '../shared/types';

const API_BASE_URL = '/api';

// 获取认证 token
const getAuthToken = () => {
  // 这里可以从 Auth0 或其他认证服务获取 token
  return localStorage.getItem('auth_token');
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10秒超时
});

// 请求拦截器 - 添加认证 token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理认证错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 处理认证失败 - 不自动重定向，让Auth0处理
      localStorage.removeItem('auth_token');
      console.log('Authentication failed, token cleared');
    }
    return Promise.reject(error);
  }
);

export const memoApi = {
  // 获取所有备忘录
  getAllMemos: async (): Promise<MemoCard[]> => {
    const response = await api.get('/memos');
    return response.data.data;
  },

  // 获取单个备忘录
  getMemo: async (id: string): Promise<MemoCard> => {
    const response = await api.get(`/memos/${id}`);
    return response.data.data;
  },

  // 删除备忘录
  deleteMemo: async (id: string): Promise<void> => {
    await api.delete(`/memos/${id}`);
  },

  // 更新备忘录
  updateMemo: async (id: string, updates: { summary?: string; oneLineSummary?: string; keyPoints?: string[]; summaryZh?: string; oneLineSummaryZh?: string; keyPointsZh?: string[] }): Promise<MemoCard> => {
    const response = await api.put(`/memos/${id}`, updates);
    return response.data.data;
  },

  // 生成指定语言的总结
  generateLanguageSummary: async (id: string, language: Language): Promise<GenerateLanguageResponse> => {
    const response = await api.post(`/memos/${id}/generate-language`, { language });
    return response.data;
  },

  // 总结内容
  summarize: async (request: SummarizeRequest): Promise<MemoCard> => {
    const response = await api.post('/summarize', request);
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data;
  },

  // 发送聊天消息
  sendChatMessage: async (request: ChatRequest): Promise<ChatMessage[]> => {
    const response = await api.post('/chat', request);
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data; // 现在返回消息数组
  },

  // 获取聊天历史
  getChatMessages: async (memoId: string): Promise<ChatMessage[]> => {
    const response = await api.get(`/chat/${memoId}`);
    return response.data.data;
  },
};

// 认证相关 API
export const authApi = {
  // 获取用户信息
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  // 设置认证 token
  setAuthToken: (token: string) => {
    localStorage.setItem('auth_token', token);
  },
  
  // 清除认证 token
  clearAuthToken: () => {
    localStorage.removeItem('auth_token');
  },
  
  // 检查是否已认证
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  }
};

export const collectionApi = {
  // 获取所有collections
  getAllCollections: async (): Promise<Collection[]> => {
    const response = await api.get('/collections');
    return response.data.data;
  },

  // 获取单个collection
  getCollection: async (id: string): Promise<Collection> => {
    const response = await api.get(`/collections/${id}`);
    return response.data.data;
  },

  // 创建collection
  createCollection: async (request: CreateCollectionRequest): Promise<Collection> => {
    const response = await api.post('/collections', request);
    return response.data.data;
  },

  // 获取collection中的memos
  getCollectionMemos: async (collectionId: string): Promise<CollectionMemo[]> => {
    const response = await api.get(`/collections/${collectionId}/memos`);
    return response.data.data;
  },

  // 添加memo到collection
  addMemoToCollection: async (request: AddMemoToCollectionRequest): Promise<CollectionMemo> => {
    const response = await api.post(`/collections/${request.collection_id}/memos`, {
      memo_id: request.memo_id
    });
    return response.data.data;
  },

  // 从collection中移除memo
  removeMemoFromCollection: async (collectionId: string, memoId: string): Promise<void> => {
    await api.delete(`/collections/${collectionId}/memos/${memoId}`);
  },

  // 删除collection
  deleteCollection: async (id: string): Promise<void> => {
    await api.delete(`/collections/${id}`);
  },

  // Collection 聊天功能
  sendChatMessage: async (request: ChatRequest): Promise<ChatMessage[]> => {
    const response = await api.post(`/collections/${request.memoId}/chat`, {
      message: request.message
    });
    return response.data.data;
  },

  // 获取 collection 的聊天记录
  getChatMessages: async (collectionId: string): Promise<ChatMessage[]> => {
    const response = await api.get(`/collections/${collectionId}/chat`);
    return response.data.data;
  },
};

export default api;
