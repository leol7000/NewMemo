import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Note, NoteCard, CreateNoteRequest, UpdateNoteRequest, NoteChatRequest } from '../shared/types';
import { noteApi } from '../services/api';

interface NotesContextType {
  notes: NoteCard[];
  loading: boolean;
  error: string | null;
  createNote: (data: CreateNoteRequest) => Promise<Note>;
  updateNote: (id: string, data: UpdateNoteRequest) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  summarizeNote: (id: string) => Promise<Note>;
  chatWithNote: (data: NoteChatRequest) => Promise<any[]>;
  refreshNotes: () => Promise<void>;
  clearError: () => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

interface NotesProviderProps {
  children: ReactNode;
}

export const NotesProvider: React.FC<NotesProviderProps> = ({ children }) => {
  const [notes, setNotes] = useState<NoteCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await noteApi.getAllNotes();
      setNotes(data);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (data: CreateNoteRequest): Promise<Note> => {
    try {
      setError(null);
      const newNote = await noteApi.createNote(data);
      await refreshNotes(); // 刷新列表
      return newNote;
    } catch (err) {
      console.error('Failed to create note:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create note';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateNote = async (id: string, data: UpdateNoteRequest): Promise<Note> => {
    try {
      setError(null);
      const updatedNote = await noteApi.updateNote(id, data);
      await refreshNotes(); // 刷新列表
      return updatedNote;
    } catch (err) {
      console.error('Failed to update note:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update note';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteNote = async (id: string): Promise<void> => {
    try {
      setError(null);
      await noteApi.deleteNote(id);
      await refreshNotes(); // 刷新列表
    } catch (err) {
      console.error('Failed to delete note:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const summarizeNote = async (id: string): Promise<Note> => {
    try {
      setError(null);
      const summarizedNote = await noteApi.summarizeNote(id);
      await refreshNotes(); // 刷新列表
      return summarizedNote;
    } catch (err) {
      console.error('Failed to summarize note:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to summarize note';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const chatWithNote = async (data: NoteChatRequest): Promise<any[]> => {
    try {
      setError(null);
      const messages = await noteApi.chatWithNote(data);
      return messages;
    } catch (err) {
      console.error('Failed to chat with note:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to chat with note';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // 初始化时加载笔记
  useEffect(() => {
    refreshNotes();
  }, []);

  const value: NotesContextType = {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    summarizeNote,
    chatWithNote,
    refreshNotes,
    clearError,
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};
