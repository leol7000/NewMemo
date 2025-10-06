import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { MemoCard } from '../shared/types';
import { memoApi } from '../services/api';

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

  const loadMemos = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const memos = await memoApi.getAllMemos();
      dispatch({ type: 'SET_MEMOS', payload: memos });
    } catch (error) {
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
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create memo' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteMemo = async (id: string) => {
    try {
      await memoApi.deleteMemo(id);
      dispatch({ type: 'REMOVE_MEMO', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete memo' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  useEffect(() => {
    loadMemos();
  }, []);

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
