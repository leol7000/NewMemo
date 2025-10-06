-- Supabase Database Schema for Mymemo AI 3.0
-- Run these commands in your Supabase SQL editor

-- Enable Row Level Security
ALTER TABLE IF EXISTS memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS memo_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages ENABLE ROW LEVEL SECURITY;

-- Create memos table
CREATE TABLE IF NOT EXISTS memos (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('website', 'youtube')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
  cover_image TEXT,
  one_line_summary TEXT,
  key_points TEXT, -- JSON string
  metadata TEXT, -- JSON string
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create memo_collections junction table
CREATE TABLE IF NOT EXISTS memo_collections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  memo_id TEXT REFERENCES memos(id) ON DELETE CASCADE,
  collection_id TEXT REFERENCES collections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(memo_id, collection_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  memo_id TEXT REFERENCES memos(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memos_user_id ON memos(user_id);
CREATE INDEX IF NOT EXISTS idx_memos_created_at ON memos(created_at);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_memo_collections_memo_id ON memo_collections(memo_id);
CREATE INDEX IF NOT EXISTS idx_memo_collections_collection_id ON memo_collections(collection_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_memo_id ON chat_messages(memo_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Row Level Security Policies
-- Users can only see their own memos
CREATE POLICY "Users can view own memos" ON memos
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own memos" ON memos
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own memos" ON memos
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own memos" ON memos
  FOR DELETE USING (auth.uid()::text = user_id);

-- Users can only see their own collections
CREATE POLICY "Users can view own collections" ON collections
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own collections" ON collections
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own collections" ON collections
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own collections" ON collections
  FOR DELETE USING (auth.uid()::text = user_id);

-- Users can only manage their own memo-collection relationships
CREATE POLICY "Users can view own memo collections" ON memo_collections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memos 
      WHERE memos.id = memo_collections.memo_id 
      AND memos.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own memo collections" ON memo_collections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memos 
      WHERE memos.id = memo_collections.memo_id 
      AND memos.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own memo collections" ON memo_collections
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM memos 
      WHERE memos.id = memo_collections.memo_id 
      AND memos.user_id = auth.uid()::text
    )
  );

-- Users can only see chat messages for their own memos
CREATE POLICY "Users can view own chat messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memos 
      WHERE memos.id = chat_messages.memo_id 
      AND memos.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memos 
      WHERE memos.id = chat_messages.memo_id 
      AND memos.user_id = auth.uid()::text
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_memos_updated_at BEFORE UPDATE ON memos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
