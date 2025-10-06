import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { MemoCard } from '../shared/types';
import { memoApi } from '../services/api';
import { useAuth } from './AuthContext';

interface MemoState {
  memos: MemoCard[];
  loading: boolean;
  error: string | null;
}

type MemoAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MEMOS'; payload: MemoCard[] }
  | { type: 'ADD_MEMO'; payload: MemoCard }
  | { type: 'REMOVE_MEMO'; payload: string };

const initialState: MemoState = {
  memos: [],
  loading: false,
  error: null,
};

const memoReducer = (state: MemoState, action: MemoAction): MemoState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_MEMOS':
      return { ...state, memos: action.payload };
    case 'ADD_MEMO':
      return { ...state, memos: [action.payload, ...state.memos] };
    case 'REMOVE_MEMO':
      return { ...state, memos: state.memos.filter(memo => memo.id !== action.payload) };
    default:
      return state;
  }
};

interface MemoContextType {
  state: MemoState;
  loadMemos: () => Promise<void>;
  addMemo: (url: string, type: 'website' | 'youtube') => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  clearError: () => void;
}

const MemoContext = createContext<MemoContextType | undefined>(undefined);

export const MemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(memoReducer, initialState);
  const { isAuthenticated, isLoading } = useAuth();
  const [hasInitialized, setHasInitialized] = useState(false);

  const loadMemos = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const memos = await memoApi.getAllMemos();
      dispatch({ type: 'SET_MEMOS', payload: memos });
    } catch (error) {
      console.error('Failed to load memos:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load memos' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addMemo = async (url: string, type: 'website' | 'youtube') => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const memo = await memoApi.summarize({ url, type });
      dispatch({ type: 'ADD_MEMO', payload: memo });
      
      // 如果 memo 状态是 processing，启动轮询检查状态
      if (memo.status === 'processing') {
        pollMemoStatus(memo.id);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create memo' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const pollMemoStatus = async (memoId: string) => {
    const maxAttempts = 30; // 最多轮询30次
    let attempts = 0;
    
    const poll = async () => {
      try {
        attempts++;
        const memo = await memoApi.getMemo(memoId);
        
        if (memo.status === 'completed' || memo.status === 'failed') {
          // 处理完成，重新加载所有 memos
          loadMemos();
          return;
        }
        
        if (attempts < maxAttempts) {
          // 继续轮询
          setTimeout(poll, 2000); // 每2秒检查一次
        } else {
          // 超时，重新加载一次
          loadMemos();
        }
      } catch (error) {
        console.error('Error polling memo status:', error);
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        }
      }
    };
    
    // 开始轮询
    setTimeout(poll, 2000);
  };

  const deleteMemo = async (id: string) => {
    try {
      await memoApi.deleteMemo(id);
      dispatch({ type: 'REMOVE_MEMO', payload: id });
    } catch (error) {
      console.error('Failed to delete memo:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete memo' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  useEffect(() => {
    // 只有在认证状态明确时才处理
    if (!isLoading) {
      if (isAuthenticated && !hasInitialized) {
        // 用户已认证且未初始化，加载 memos
        loadMemos();
        setHasInitialized(true);
      } else if (!isAuthenticated && hasInitialized) {
        // 只有在已经初始化过且确认未认证时才清空
        dispatch({ type: 'SET_MEMOS', payload: [] });
      }
    }
  }, [isAuthenticated, isLoading, hasInitialized]);

  // 监听 token 准备就绪事件
  useEffect(() => {
    const handleTokenReady = () => {
      if (isAuthenticated && hasInitialized) {
        loadMemos();
      }
    };

    window.addEventListener('authTokenReady', handleTokenReady);
    return () => window.removeEventListener('authTokenReady', handleTokenReady);
  }, [isAuthenticated, hasInitialized]);

  return (
    <MemoContext.Provider value={{ state, loadMemos, addMemo, deleteMemo, clearError }}>
      {children}
    </MemoContext.Provider>
  );
};

export const useMemos = () => {
  const context = useContext(MemoContext);
  if (context === undefined) {
    throw new Error('useMemos must be used within a MemoProvider');
  }
  return context;
};
