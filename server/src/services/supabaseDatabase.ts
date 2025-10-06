import { supabase } from '../config/supabase';
import { MemoCard, Collection } from '../../shared/types';

export class SupabaseDatabase {
  // 初始化方法 - Supabase不需要初始化
  async init(): Promise<void> {
    console.log('✅ Supabase database connected');
  }
  // Memos CRUD operations
  async getMemo(id: string): Promise<MemoCard | null> {
    try {
      const { data, error } = await supabase
        .from('memos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching memo:', error);
        throw error;
      }

      return data ? this.mapMemoResult(data) : null;
    } catch (error) {
      console.error('getMemo error:', error);
      throw error;
    }
  }

  async getAllMemos(userId?: string): Promise<MemoCard[]> {
    try {
      let query = supabase
        .from('memos')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching memos:', error);
        throw error;
      }

      return data?.map(this.mapMemoResult) || [];
    } catch (error) {
      console.error('getAllMemos error:', error);
      throw error;
    }
  }

  async createMemo(memo: Omit<MemoCard, 'createdAt' | 'updatedAt'>, userId?: string): Promise<MemoCard> {
    try {
      const memoData = {
        id: memo.id,
        url: memo.url,
        title: memo.title,
        summary: memo.summary,
        type: memo.type,
        status: memo.status || 'completed',
        cover_image: memo.coverImage,
        one_line_summary: memo.oneLineSummary,
        key_points: memo.keyPoints ? JSON.stringify(memo.keyPoints) : null,
        metadata: memo.metadata ? JSON.stringify(memo.metadata) : null,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('memos')
        .insert([memoData])
        .select()
        .single();

      if (error) {
        console.error('Error creating memo:', error);
        throw error;
      }

      return this.mapMemoResult(data);
    } catch (error) {
      console.error('createMemo error:', error);
      throw error;
    }
  }

  async createEmptyMemo(memo: { id: string; url: string; type: string; status: string }, userId?: string): Promise<MemoCard> {
    try {
      console.log('SupabaseDatabase.createEmptyMemo - userId:', userId);
      const memoData = {
        id: memo.id,
        url: memo.url,
        title: 'Processing...',
        summary: 'Processing content...',
        type: memo.type,
        status: memo.status,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('SupabaseDatabase.createEmptyMemo - memoData:', memoData);

      const { data, error } = await supabase
        .from('memos')
        .insert([memoData])
        .select()
        .single();

      if (error) {
        console.error('Error creating empty memo:', error);
        throw error;
      }

      return this.mapMemoResult(data);
    } catch (error) {
      console.error('createEmptyMemo error:', error);
      throw error;
    }
  }

  async updateMemo(memoId: string, updates: Partial<MemoCard>): Promise<MemoCard> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Map fields to database columns
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.summary !== undefined) updateData.summary = updates.summary;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.coverImage !== undefined) updateData.cover_image = updates.coverImage;
      if (updates.oneLineSummary !== undefined) updateData.one_line_summary = updates.oneLineSummary;
      if (updates.keyPoints !== undefined) updateData.key_points = JSON.stringify(updates.keyPoints);
      if (updates.metadata !== undefined) updateData.metadata = JSON.stringify(updates.metadata);

      const { data, error } = await supabase
        .from('memos')
        .update(updateData)
        .eq('id', memoId)
        .select()
        .single();

      if (error) {
        console.error('Error updating memo:', error);
        throw error;
      }

      return this.mapMemoResult(data);
    } catch (error) {
      console.error('updateMemo error:', error);
      throw error;
    }
  }

  async deleteMemo(memoId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('memos')
        .delete()
        .eq('id', memoId);

      if (error) {
        console.error('Error deleting memo:', error);
        throw error;
      }
    } catch (error) {
      console.error('deleteMemo error:', error);
      throw error;
    }
  }

  // Collections CRUD operations
  async getAllCollections(userId?: string): Promise<Collection[]> {
    try {
      let query = supabase
        .from('collections')
        .select(`
          *,
          memos:memo_collections(count)
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching collections:', error);
        throw error;
      }

      return data?.map(this.mapCollectionResult) || [];
    } catch (error) {
      console.error('getAllCollections error:', error);
      throw error;
    }
  }

  async getCollection(id: string): Promise<Collection | null> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          memos:memo_collections(count)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching collection:', error);
        throw error;
      }

      return data ? this.mapCollectionResult(data) : null;
    } catch (error) {
      console.error('getCollection error:', error);
      throw error;
    }
  }

  async getCollectionMemos(collectionId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('memo_collections')
        .select(`
          *,
          memo:memos(*)
        `)
        .eq('collection_id', collectionId);

      if (error) {
        console.error('Error fetching collection memos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('getCollectionMemos error:', error);
      throw error;
    }
  }

  async addMemoToCollection(collectionId: string, memoId: string): Promise<any> {
    try {
      const id = `mc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const { data, error } = await supabase
        .from('memo_collections')
        .insert([{
          id,
          collection_id: collectionId,
          memo_id: memoId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding memo to collection:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('addMemoToCollection error:', error);
      throw error;
    }
  }

  async removeMemoFromCollection(collectionId: string, memoId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('memo_collections')
        .delete()
        .eq('collection_id', collectionId)
        .eq('memo_id', memoId);

      if (error) {
        console.error('Error removing memo from collection:', error);
        throw error;
      }
    } catch (error) {
      console.error('removeMemoFromCollection error:', error);
      throw error;
    }
  }

  async createCollection(collection: Omit<Collection, 'createdAt' | 'updatedAt' | 'memo_count'>, userId?: string): Promise<Collection> {
    try {
      const collectionData = {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        color: collection.color,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('collections')
        .insert([collectionData])
        .select()
        .single();

      if (error) {
        console.error('Error creating collection:', error);
        throw error;
      }

      return this.mapCollectionResult(data);
    } catch (error) {
      console.error('createCollection error:', error);
      throw error;
    }
  }

  async updateCollection(collectionId: string, updates: Partial<Collection>): Promise<Collection> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.color !== undefined) updateData.color = updates.color;

      const { data, error } = await supabase
        .from('collections')
        .update(updateData)
        .eq('id', collectionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating collection:', error);
        throw error;
      }

      return this.mapCollectionResult(data);
    } catch (error) {
      console.error('updateCollection error:', error);
      throw error;
    }
  }

  async deleteCollection(collectionId: string): Promise<void> {
    try {
      // First delete all memo-collection relationships
      await supabase
        .from('memo_collections')
        .delete()
        .eq('collection_id', collectionId);

      // Then delete the collection
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId);

      if (error) {
        console.error('Error deleting collection:', error);
        throw error;
      }
    } catch (error) {
      console.error('deleteCollection error:', error);
      throw error;
    }
  }

  // Chat operations
  async getChatMessages(memoId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('memo_id', memoId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching chat messages:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('getChatMessages error:', error);
      throw error;
    }
  }

  async createChatMessage(message: { id: string; memoId: string; role: string; content: string }): Promise<any> {
    try {
      const messageData = {
        id: message.id,
        memo_id: message.memoId,
        role: message.role,
        content: message.content,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('chat_messages')
        .insert([messageData])
        .select()
        .single();

      if (error) {
        console.error('Error creating chat message:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('createChatMessage error:', error);
      throw error;
    }
  }

  // Notes CRUD operations
  async getAllNotes(userId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notes:', error);
        throw error;
      }

      return data?.map(this.mapNoteResult) || [];
    } catch (error) {
      console.error('getAllNotes error:', error);
      throw error;
    }
  }

  async getNote(id: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching note:', error);
        throw error;
      }

      return data ? this.mapNoteResult(data) : null;
    } catch (error) {
      console.error('getNote error:', error);
      throw error;
    }
  }

  async createNote(note: { id: string; title: string; content: string; status?: string }, userId?: string): Promise<any> {
    try {
      const noteData = {
        id: note.id,
        title: note.title,
        content: note.content,
        status: note.status || 'draft',
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('notes')
        .insert([noteData])
        .select()
        .single();

      if (error) {
        console.error('Error creating note:', error);
        throw error;
      }

      return this.mapNoteResult(data);
    } catch (error) {
      console.error('createNote error:', error);
      throw error;
    }
  }

  async updateNote(noteId: string, updates: any): Promise<any> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.summary !== undefined) updateData.summary = updates.summary;
      if (updates.oneLineSummary !== undefined) updateData.one_line_summary = updates.oneLineSummary;
      if (updates.keyPoints !== undefined) updateData.key_points = JSON.stringify(updates.keyPoints);
      if (updates.status !== undefined) updateData.status = updates.status;

      const { data, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', noteId)
        .select()
        .single();

      if (error) {
        console.error('Error updating note:', error);
        throw error;
      }

      return this.mapNoteResult(data);
    } catch (error) {
      console.error('updateNote error:', error);
      throw error;
    }
  }

  async deleteNote(noteId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) {
        console.error('Error deleting note:', error);
        throw error;
      }
    } catch (error) {
      console.error('deleteNote error:', error);
      throw error;
    }
  }

  // Note chat operations
  async getNoteChatMessages(noteId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('note_chat_messages')
        .select('*')
        .eq('note_id', noteId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching note chat messages:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('getNoteChatMessages error:', error);
      throw error;
    }
  }

  async createNoteChatMessage(message: { id: string; noteId: string; role: string; content: string }): Promise<any> {
    try {
      const messageData = {
        id: message.id,
        note_id: message.noteId,
        role: message.role,
        content: message.content,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('note_chat_messages')
        .insert([messageData])
        .select()
        .single();

      if (error) {
        console.error('Error creating note chat message:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('createNoteChatMessage error:', error);
      throw error;
    }
  }

  // Helper methods
  private mapMemoResult(result: any): MemoCard {
    return {
      id: result.id,
      url: result.url,
      title: result.title,
      summary: result.summary,
      type: result.type,
      status: result.status,
      coverImage: result.cover_image,
      oneLineSummary: result.one_line_summary,
      keyPoints: result.key_points ? JSON.parse(result.key_points) : undefined,
      metadata: result.metadata ? JSON.parse(result.metadata) : undefined,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
  }

  private mapCollectionResult(result: any): Collection {
    return {
      id: result.id,
      name: result.name,
      description: result.description,
      color: result.color,
      memo_count: result.memos?.[0]?.count || 0,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
  }

  private mapNoteResult(result: any): any {
    return {
      id: result.id,
      title: result.title,
      content: result.content,
      summary: result.summary,
      oneLineSummary: result.one_line_summary,
      keyPoints: result.key_points ? JSON.parse(result.key_points) : undefined,
      status: result.status,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
  }
}
