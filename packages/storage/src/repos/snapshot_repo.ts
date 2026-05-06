import { getDb } from '../db.js';
import type { HotSnapshot } from '@webhot/schemas';
import { v4 as uuid } from 'uuid';

export class SnapshotRepo {
  insert(snap: HotSnapshot): void {
    const db = getDb();
    db.prepare(`
      INSERT OR REPLACE INTO hot_snapshots (id, source, platform, topic_id, title,
        heat_score, trend_score, rank, collected_at, metrics)
      VALUES (@id, @source, @platform, @topicId, @title,
        @heatScore, @trendScore, @rank, @collectedAt, @metrics)
    `).run({
      id: snap.id || uuid(),
      source: snap.source,
      platform: snap.platform,
      topicId: snap.topicId || null,
      title: snap.title,
      heatScore: snap.heatScore,
      trendScore: snap.trendScore ?? null,
      rank: snap.rank ?? null,
      collectedAt: snap.collectedAt,
      metrics: snap.metrics ? JSON.stringify(snap.metrics) : null,
    });
  }

  insertMany(snapshots: HotSnapshot[]): void {
    const db = getDb();
    const insert = db.prepare(`
      INSERT OR REPLACE INTO hot_snapshots (id, source, platform, topic_id, title,
        heat_score, trend_score, rank, collected_at, metrics)
      VALUES (@id, @source, @platform, @topicId, @title,
        @heatScore, @trendScore, @rank, @collectedAt, @metrics)
    `);
    db.transaction(() => {
      for (const s of snapshots) {
        insert.run({
          id: s.id || uuid(),
          source: s.source,
          platform: s.platform,
          topicId: s.topicId || null,
          title: s.title,
          heatScore: s.heatScore,
          trendScore: s.trendScore ?? null,
          rank: s.rank ?? null,
          collectedAt: s.collectedAt,
          metrics: s.metrics ? JSON.stringify(s.metrics) : null,
        });
      }
    })();
  }

  findByTopic(topicId: string): HotSnapshot[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM hot_snapshots WHERE topic_id = ? ORDER BY collected_at ASC'
    ).all(topicId) as Record<string, unknown>[];
    return rows.map(r => this._deserialize(r));
  }

  findRecent(source: string, since: string): HotSnapshot[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM hot_snapshots WHERE source = ? AND collected_at >= ? ORDER BY collected_at DESC'
    ).all(source, since) as Record<string, unknown>[];
    return rows.map(r => this._deserialize(r));
  }

  // Diff: 对比当前排名和 N 分钟前的快照排名，检测排名变化
  getRankChanges(source: string, minutesAgo: number): Array<{ title: string; oldRank: number; newRank: number }> {
    const db = getDb();
    // SQLite date 函数生成的格式可能与 collected_at 存储格式不完全一致，这里用简单字符串比较
    const rows = db.prepare(`
      WITH recent AS (
        SELECT title, rank as new_rank
        FROM hot_snapshots
        WHERE source = ? AND collected_at = (SELECT MAX(collected_at) FROM hot_snapshots WHERE source = ?)
      ),
      old AS (
        SELECT title, rank as old_rank
        FROM hot_snapshots
        WHERE source = ?
          AND collected_at <= datetime('now', ? || ' minutes')
        GROUP BY title
      )
      SELECT recent.title, old.old_rank, recent.new_rank
      FROM recent
      LEFT JOIN old ON recent.title = old.title
      WHERE recent.new_rank IS NOT NULL
    `).all(source, source, source, `-${minutesAgo}`) as Record<string, unknown>[];
    return rows as any[];
  }

  private _deserialize(row: Record<string, unknown>): HotSnapshot {
    return {
      id: row.id as string,
      source: row.source as string,
      platform: row.platform as string,
      topicId: row.topic_id as string,
      title: row.title as string,
      heatScore: row.heat_score as number,
      trendScore: row.trend_score as number | undefined,
      rank: row.rank as number | undefined,
      collectedAt: row.collected_at as string,
      metrics: row.metrics ? JSON.parse(row.metrics as string) : undefined,
    };
  }
}
