import { getDb } from './db.js';

export function runMigrations(): void {
  const db = getDb();

  db.exec(`
    -- 热点条目表
    CREATE TABLE IF NOT EXISTS hot_items (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      platform TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      url TEXT NOT NULL,
      author TEXT,
      rank INTEGER,
      heat_score REAL DEFAULT 0,
      trend_score REAL DEFAULT 0,
      finance_score REAL DEFAULT 0,
      ai_score REAL DEFAULT 0,
      categories TEXT,       -- JSON array
      tags TEXT,             -- JSON array
      metrics TEXT,          -- JSON object
      published_at TEXT,
      collected_at TEXT NOT NULL,
      language TEXT DEFAULT 'zh',
      region TEXT DEFAULT 'cn',
      raw TEXT,              -- JSON
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_hot_items_source ON hot_items(source);
    CREATE INDEX IF NOT EXISTS idx_hot_items_platform ON hot_items(platform);
    CREATE INDEX IF NOT EXISTS idx_hot_items_collected_at ON hot_items(collected_at);
    CREATE INDEX IF NOT EXISTS idx_hot_items_heat ON hot_items(heat_score DESC);

    -- 热点快照表（用于 Diff 对比）
    CREATE TABLE IF NOT EXISTS hot_snapshots (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      platform TEXT NOT NULL,
      topic_id TEXT,
      title TEXT NOT NULL,
      heat_score REAL DEFAULT 0,
      trend_score REAL DEFAULT 0,
      rank INTEGER,
      collected_at TEXT NOT NULL,
      metrics TEXT,          -- JSON object
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_snapshots_source ON hot_snapshots(source);
    CREATE INDEX IF NOT EXISTS idx_snapshots_topic_id ON hot_snapshots(topic_id);
    CREATE INDEX IF NOT EXISTS idx_snapshots_collected_at ON hot_snapshots(collected_at);

    -- Topic 聚类表
    CREATE TABLE IF NOT EXISTS topic_clusters (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      aliases TEXT,          -- JSON array
      category TEXT NOT NULL DEFAULT 'Technology',
      hot_items TEXT,        -- JSON array of IDs
      trend_score REAL DEFAULT 0,
      growth_score REAL DEFAULT 0,
      platforms TEXT,         -- JSON array
      related_stocks TEXT,    -- JSON array
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_clusters_category ON topic_clusters(category);
    CREATE INDEX IF NOT EXISTS idx_clusters_trend ON topic_clusters(trend_score DESC);

    -- Timeline 事件表
    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      time TEXT NOT NULL,
      platform TEXT NOT NULL,
      source TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT,
      summary TEXT,
      metrics TEXT,          -- JSON object
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_timeline_topic_id ON timeline_events(topic_id);
    CREATE INDEX IF NOT EXISTS idx_timeline_time ON timeline_events(time);

    -- Signal 信号表
    CREATE TABLE IF NOT EXISTS signals (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,          -- explosion | cross_platform | finance | ai | risk
      topic_id TEXT NOT NULL,
      title TEXT NOT NULL,
      score REAL DEFAULT 0,
      description TEXT,
      platforms TEXT,              -- JSON array
      triggered_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_signals_type ON signals(type);
    CREATE INDEX IF NOT EXISTS idx_signals_topic_id ON signals(topic_id);
    CREATE INDEX IF NOT EXISTS idx_signals_triggered_at ON signals(triggered_at);

    -- 世界变化记录表 (Change Database)
    CREATE TABLE IF NOT EXISTS world_changes (
      id TEXT PRIMARY KEY,
      topic_id TEXT,
      change_type TEXT NOT NULL,   -- new_hot | heat_surge | cross_platform | trend_start | trend_peak | trend_decay | finance_link | ai_link
      title TEXT NOT NULL,
      from_value REAL,
      to_value REAL,
      platforms TEXT,              -- JSON array
      recorded_at TEXT NOT NULL,
      metadata TEXT,               -- JSON
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_changes_topic_id ON world_changes(topic_id);
    CREATE INDEX IF NOT EXISTS idx_changes_type ON world_changes(change_type);
    CREATE INDEX IF NOT EXISTS idx_changes_recorded_at ON world_changes(recorded_at);
  `);

  console.log('[storage] migrations complete');
}
