import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { MemoCard, ChatMessage, Collection, CollectionMemo } from '../../shared/types';

export class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(process.env.DATABASE_PATH || './data/flymemo.db');
  }

  async init(): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    
    // 创建备忘录表
    await run(`
      CREATE TABLE IF NOT EXISTS memos (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('website', 'youtube')),
        status TEXT DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
        cover_image TEXT,
        one_line_summary TEXT,
        key_points TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建聊天消息表
    await run(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        memo_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (memo_id) REFERENCES memos (id) ON DELETE CASCADE
      )
    `);

    // 创建collections表
    await run(`
      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#3B82F6',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建collection_memos表 (多对多关系)
    await run(`
      CREATE TABLE IF NOT EXISTS collection_memos (
        id TEXT PRIMARY KEY,
        collection_id TEXT NOT NULL,
        memo_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collection_id) REFERENCES collections (id) ON DELETE CASCADE,
        FOREIGN KEY (memo_id) REFERENCES memos (id) ON DELETE CASCADE,
        UNIQUE(collection_id, memo_id)
      )
    `);

    // 数据库迁移：添加缺失的列
    await this.migrateDatabase();

    console.log('✅ Database initialized');
  }

  private async migrateDatabase(): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));
    
    try {
      // 检查是否存在 status 列
      const hasStatus = await get(`
        SELECT name FROM pragma_table_info('memos') WHERE name = 'status'
      `);
      
      if (!hasStatus) {
        await run('ALTER TABLE memos ADD COLUMN status TEXT DEFAULT "completed"');
        console.log('Added status column');
      }
      
      // 检查是否存在 one_line_summary 列
      const hasOneLineSummary = await get(`
        SELECT name FROM pragma_table_info('memos') WHERE name = 'one_line_summary'
      `);
      
      if (!hasOneLineSummary) {
        await run('ALTER TABLE memos ADD COLUMN one_line_summary TEXT');
        console.log('Added one_line_summary column');
      }
      
      // 检查是否存在 key_points 列
      const hasKeyPoints = await get(`
        SELECT name FROM pragma_table_info('memos') WHERE name = 'key_points'
      `);
      
      if (!hasKeyPoints) {
        await run('ALTER TABLE memos ADD COLUMN key_points TEXT');
        console.log('Added key_points column');
      }
      
      // 检查是否存在 summary_zh 列
      const hasSummaryZh = await get(`
        SELECT name FROM pragma_table_info('memos') WHERE name = 'summary_zh'
      `);
      
      if (!hasSummaryZh) {
        await run('ALTER TABLE memos ADD COLUMN summary_zh TEXT');
        console.log('Added summary_zh column');
      }
      
      // 检查是否存在 one_line_summary_zh 列
      const hasOneLineSummaryZh = await get(`
        SELECT name FROM pragma_table_info('memos') WHERE name = 'one_line_summary_zh'
      `);
      
      if (!hasOneLineSummaryZh) {
        await run('ALTER TABLE memos ADD COLUMN one_line_summary_zh TEXT');
        console.log('Added one_line_summary_zh column');
      }
      
      // 检查是否存在 key_points_zh 列
      const hasKeyPointsZh = await get(`
        SELECT name FROM pragma_table_info('memos') WHERE name = 'key_points_zh'
      `);
      
      if (!hasKeyPointsZh) {
        await run('ALTER TABLE memos ADD COLUMN key_points_zh TEXT');
        console.log('Added key_points_zh column');
      }
      
      // 添加其他语言字段
      const languageFields = [
        'summary_es_eu', 'one_line_summary_es_eu', 'key_points_es_eu',
        'summary_pt_eu', 'one_line_summary_pt_eu', 'key_points_pt_eu',
        'summary_es_latam', 'one_line_summary_es_latam', 'key_points_es_latam',
        'summary_pt_latam', 'one_line_summary_pt_latam', 'key_points_pt_latam',
        'summary_de', 'one_line_summary_de', 'key_points_de',
        'summary_fr', 'one_line_summary_fr', 'key_points_fr',
        'summary_ja', 'one_line_summary_ja', 'key_points_ja',
        'summary_th', 'one_line_summary_th', 'key_points_th'
      ];
      
      for (const field of languageFields) {
        const hasField = await get(`
          SELECT name FROM pragma_table_info('memos') WHERE name = '${field}'
        `);
        
        if (!hasField) {
          await run(`ALTER TABLE memos ADD COLUMN ${field} TEXT`);
          console.log(`Added ${field} column`);
        }
      }
      
    } catch (error) {
      console.error('Migration error:', error);
    }
  }

  async createMemo(memo: Omit<MemoCard, 'createdAt' | 'updatedAt'>): Promise<MemoCard> {
    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));
    
    const now = new Date().toISOString();
    const metadata = memo.metadata ? JSON.stringify(memo.metadata) : null;
    const keyPoints = memo.keyPoints ? JSON.stringify(memo.keyPoints) : null;
    const keyPointsZh = memo.keyPointsZh ? JSON.stringify(memo.keyPointsZh) : null;
    const keyPointsEsEu = memo.keyPointsEsEu ? JSON.stringify(memo.keyPointsEsEu) : null;
    const keyPointsPtEu = memo.keyPointsPtEu ? JSON.stringify(memo.keyPointsPtEu) : null;
    const keyPointsEsLatam = memo.keyPointsEsLatam ? JSON.stringify(memo.keyPointsEsLatam) : null;
    const keyPointsPtLatam = memo.keyPointsPtLatam ? JSON.stringify(memo.keyPointsPtLatam) : null;
    const keyPointsDe = memo.keyPointsDe ? JSON.stringify(memo.keyPointsDe) : null;
    const keyPointsFr = memo.keyPointsFr ? JSON.stringify(memo.keyPointsFr) : null;
    const keyPointsJa = memo.keyPointsJa ? JSON.stringify(memo.keyPointsJa) : null;
    const keyPointsTh = memo.keyPointsTh ? JSON.stringify(memo.keyPointsTh) : null;
    
    await run(
      'INSERT INTO memos (id, url, title, summary, type, cover_image, one_line_summary, key_points, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [memo.id, memo.url, memo.title, memo.summary, memo.type, memo.coverImage || null, memo.oneLineSummary || null, keyPoints, metadata, now, now]
    );

    const result = await get('SELECT * FROM memos WHERE id = ?', [memo.id]) as any;
    return this.mapMemoResult(result);
  }

  async createEmptyMemo(memo: { id: string; url: string; type: string; status: string }): Promise<MemoCard> {
    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));
    
    const now = new Date().toISOString();
    
    await run(
      'INSERT INTO memos (id, url, title, summary, type, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [memo.id, memo.url, 'Processing...', 'Processing content...', memo.type, memo.status, now, now]
    );

    const result = await get('SELECT * FROM memos WHERE id = ?', [memo.id]) as any;
    return this.mapMemoResult(result);
  }

  private mapMemoResult(result: any): MemoCard {
    return {
      ...result,
      coverImage: result.cover_image,
      oneLineSummary: result.one_line_summary,
      keyPoints: result.key_points ? JSON.parse(result.key_points) : undefined,
      status: result.status || 'completed',
      summaryZh: result.summary_zh,
      oneLineSummaryZh: result.one_line_summary_zh,
      keyPointsZh: result.key_points_zh ? JSON.parse(result.key_points_zh) : undefined,
      summaryEsEu: result.summary_es_eu,
      oneLineSummaryEsEu: result.one_line_summary_es_eu,
      keyPointsEsEu: result.key_points_es_eu ? JSON.parse(result.key_points_es_eu) : undefined,
      summaryPtEu: result.summary_pt_eu,
      oneLineSummaryPtEu: result.one_line_summary_pt_eu,
      keyPointsPtEu: result.key_points_pt_eu ? JSON.parse(result.key_points_pt_eu) : undefined,
      summaryEsLatam: result.summary_es_latam,
      oneLineSummaryEsLatam: result.one_line_summary_es_latam,
      keyPointsEsLatam: result.key_points_es_latam ? JSON.parse(result.key_points_es_latam) : undefined,
      summaryPtLatam: result.summary_pt_latam,
      oneLineSummaryPtLatam: result.one_line_summary_pt_latam,
      keyPointsPtLatam: result.key_points_pt_latam ? JSON.parse(result.key_points_pt_latam) : undefined,
      summaryDe: result.summary_de,
      oneLineSummaryDe: result.one_line_summary_de,
      keyPointsDe: result.key_points_de ? JSON.parse(result.key_points_de) : undefined,
      summaryFr: result.summary_fr,
      oneLineSummaryFr: result.one_line_summary_fr,
      keyPointsFr: result.key_points_fr ? JSON.parse(result.key_points_fr) : undefined,
      summaryJa: result.summary_ja,
      oneLineSummaryJa: result.one_line_summary_ja,
      keyPointsJa: result.key_points_ja ? JSON.parse(result.key_points_ja) : undefined,
      summaryTh: result.summary_th,
      oneLineSummaryTh: result.one_line_summary_th,
      keyPointsTh: result.key_points_th ? JSON.parse(result.key_points_th) : undefined,
      metadata: result.metadata ? JSON.parse(result.metadata) : undefined,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
  }

  async getMemo(id: string): Promise<MemoCard | null> {
    const get = promisify(this.db.get.bind(this.db));
    const result = await get('SELECT * FROM memos WHERE id = ?', [id]) as any;
    
    if (!result) return null;
    
    return this.mapMemoResult(result);
  }

  async getAllMemos(): Promise<MemoCard[]> {
    const all = promisify(this.db.all.bind(this.db));
    const results = await all('SELECT * FROM memos ORDER BY created_at DESC') as any[];
    
    return results.map(result => this.mapMemoResult(result));
  }

  async updateMemo(id: string, updates: Partial<MemoCard>): Promise<MemoCard | null> {
    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));
    
    const now = new Date().toISOString();
    
    const updateFields = [];
    const updateValues = [];
    
    // 处理所有可能的更新字段
    const fieldMappings = {
      summary: 'summary',
      oneLineSummary: 'one_line_summary',
      keyPoints: 'key_points',
      summaryZh: 'summary_zh',
      oneLineSummaryZh: 'one_line_summary_zh',
      keyPointsZh: 'key_points_zh',
      summaryEsEu: 'summary_es_eu',
      oneLineSummaryEsEu: 'one_line_summary_es_eu',
      keyPointsEsEu: 'key_points_es_eu',
      summaryPtEu: 'summary_pt_eu',
      oneLineSummaryPtEu: 'one_line_summary_pt_eu',
      keyPointsPtEu: 'key_points_pt_eu',
      summaryEsLatam: 'summary_es_latam',
      oneLineSummaryEsLatam: 'one_line_summary_es_latam',
      keyPointsEsLatam: 'key_points_es_latam',
      summaryPtLatam: 'summary_pt_latam',
      oneLineSummaryPtLatam: 'one_line_summary_pt_latam',
      keyPointsPtLatam: 'key_points_pt_latam',
      summaryDe: 'summary_de',
      oneLineSummaryDe: 'one_line_summary_de',
      keyPointsDe: 'key_points_de',
      summaryFr: 'summary_fr',
      oneLineSummaryFr: 'one_line_summary_fr',
      keyPointsFr: 'key_points_fr',
      summaryJa: 'summary_ja',
      oneLineSummaryJa: 'one_line_summary_ja',
      keyPointsJa: 'key_points_ja',
      summaryTh: 'summary_th',
      oneLineSummaryTh: 'one_line_summary_th',
      keyPointsTh: 'key_points_th'
    };
    
    for (const [key, dbField] of Object.entries(fieldMappings)) {
      if (updates[key as keyof MemoCard] !== undefined) {
        let value = updates[key as keyof MemoCard];
        if (key.includes('keyPoints') && Array.isArray(value)) {
          value = JSON.stringify(value);
        }
        updateFields.push(`${dbField} = ?`);
        updateValues.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      return this.getMemo(id);
    }
    
    updateFields.push('updated_at = ?');
    updateValues.push(now, id);
    
    await run(
      `UPDATE memos SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return this.getMemo(id);
  }

  async createChatMessage(message: Omit<ChatMessage, 'timestamp'>): Promise<ChatMessage> {
    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));
    
    const timestamp = new Date().toISOString();
    
    await run(
      'INSERT INTO chat_messages (id, memo_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)',
      [message.id, message.memoId, message.role, message.content, timestamp]
    );

    const result = await get('SELECT * FROM chat_messages WHERE id = ?', [message.id]) as any;
    return {
      ...result,
      memoId: result.memo_id,
      timestamp: result.timestamp
    };
  }

  async getChatMessages(memoId: string): Promise<ChatMessage[]> {
    const all = promisify(this.db.all.bind(this.db));
    const results = await all('SELECT * FROM chat_messages WHERE memo_id = ? ORDER BY timestamp ASC', [memoId]) as any[];
    
    return results.map(result => ({
      ...result,
      memoId: result.memo_id,
      timestamp: result.timestamp
    }));
  }

  async deleteMemo(id: string): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    await run('DELETE FROM memos WHERE id = ?', [id]);
  }

  // Collection methods
  async createCollection(collection: Omit<Collection, 'createdAt' | 'updatedAt' | 'memo_count'>): Promise<Collection> {
    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));
    
    const now = new Date().toISOString();
    
    await run(
      'INSERT INTO collections (id, name, description, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [collection.id, collection.name, collection.description, collection.color || '#3B82F6', now, now]
    );

    const result = await get('SELECT * FROM collections WHERE id = ?', [collection.id]) as any;
    return {
      ...result,
      memo_count: 0,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
  }

  async getAllCollections(): Promise<Collection[]> {
    const all = promisify(this.db.all.bind(this.db));
    const results = await all(`
      SELECT c.*, COUNT(cm.memo_id) as memo_count 
      FROM collections c 
      LEFT JOIN collection_memos cm ON c.id = cm.collection_id 
      GROUP BY c.id 
      ORDER BY c.created_at DESC
    `) as any[];
    
    return results.map(result => ({
      ...result,
      memo_count: result.memo_count || 0,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    }));
  }

  async getCollection(id: string): Promise<Collection | null> {
    const get = promisify(this.db.get.bind(this.db));
    const result = await get(`
      SELECT c.*, COUNT(cm.memo_id) as memo_count 
      FROM collections c 
      LEFT JOIN collection_memos cm ON c.id = cm.collection_id 
      WHERE c.id = ? 
      GROUP BY c.id
    `, [id]) as any;
    
    if (!result) return null;
    
    return {
      ...result,
      memo_count: result.memo_count || 0,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
  }

  async getCollectionMemos(collectionId: string): Promise<CollectionMemo[]> {
    const all = promisify(this.db.all.bind(this.db));
    const results = await all(`
      SELECT cm.*, m.* 
      FROM collection_memos cm 
      JOIN memos m ON cm.memo_id = m.id 
      WHERE cm.collection_id = ? 
      ORDER BY cm.created_at DESC
    `, [collectionId]) as any[];
    
    return results.map(result => ({
      id: result.id,
      collection_id: result.collection_id,
      memo_id: result.memo_id,
      createdAt: result.created_at,
      memo: {
        id: result.memo_id,
        url: result.url,
        title: result.title,
        summary: result.summary,
        type: result.type,
        metadata: result.metadata ? JSON.parse(result.metadata) : undefined,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      }
    }));
  }

  async addMemoToCollection(collectionId: string, memoId: string): Promise<CollectionMemo> {
    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));
    
    const id = `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    await run(
      'INSERT INTO collection_memos (id, collection_id, memo_id, created_at) VALUES (?, ?, ?, ?)',
      [id, collectionId, memoId, now]
    );

    const result = await get(`
      SELECT cm.*, m.* 
      FROM collection_memos cm 
      JOIN memos m ON cm.memo_id = m.id 
      WHERE cm.id = ?
    `, [id]) as any;
    
    return {
      id: result.id,
      collection_id: result.collection_id,
      memo_id: result.memo_id,
      createdAt: result.created_at,
      memo: {
        id: result.memo_id,
        url: result.url,
        title: result.title,
        summary: result.summary,
        type: result.type,
        metadata: result.metadata ? JSON.parse(result.metadata) : undefined,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      }
    };
  }

  async removeMemoFromCollection(collectionId: string, memoId: string): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    await run('DELETE FROM collection_memos WHERE collection_id = ? AND memo_id = ?', [collectionId, memoId]);
  }

  async deleteCollection(id: string): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    await run('DELETE FROM collections WHERE id = ?', [id]);
  }
}
