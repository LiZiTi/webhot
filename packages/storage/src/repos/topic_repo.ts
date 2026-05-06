import { getDb } from '../db.js';
import type { TopicCluster } from '@webhot/schemas';
import { v4 as uuid } from 'uuid';

export class TopicRepo {
  upsert(cluster: TopicCluster): void {
    const db = getDb();
    db.prepare(`
      INSERT OR REPLACE INTO topic_clusters (id, title, aliases, category, hot_items,
        trend_score, growth_score, platforms, related_stocks, updated_at)
      VALUES (@id, @title, @aliases, @category, @hotItems,
        @trendScore, @growthScore, @platforms, @relatedStocks, datetime('now'))
    `).run({
      id: cluster.id || uuid(),
      title: cluster.title,
      aliases: JSON.stringify(cluster.aliases),
      category: cluster.category,
      hotItems: JSON.stringify(cluster.hotItems),
      trendScore: cluster.trendScore,
      growthScore: cluster.growthScore,
      platforms: JSON.stringify(cluster.platforms),
      relatedStocks: cluster.relatedStocks ? JSON.stringify(cluster.relatedStocks) : null,
    });
  }

  findById(id: string): TopicCluster | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM topic_clusters WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? this._deserialize(row) : null;
  }

  findTrending(limit: number = 20): TopicCluster[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM topic_clusters ORDER BY trend_score DESC LIMIT ?'
    ).all(limit) as Record<string, unknown>[];
    return rows.map(r => this._deserialize(r));
  }

  findByCategory(category: string, limit: number = 20): TopicCluster[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM topic_clusters WHERE category = ? ORDER BY trend_score DESC LIMIT ?'
    ).all(category, limit) as Record<string, unknown>[];
    return rows.map(r => this._deserialize(r));
  }

  findExploding(minGrowthScore: number = 5): TopicCluster[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM topic_clusters WHERE growth_score >= ? ORDER BY growth_score DESC'
    ).all(minGrowthScore) as Record<string, unknown>[];
    return rows.map(r => this._deserialize(r));
  }

  private _deserialize(row: Record<string, unknown>): TopicCluster {
    return {
      id: row.id as string,
      title: row.title as string,
      aliases: JSON.parse(row.aliases as string),
      category: row.category as string,
      hotItems: JSON.parse(row.hot_items as string),
      trendScore: row.trend_score as number,
      growthScore: row.growth_score as number,
      platforms: JSON.parse(row.platforms as string),
      relatedStocks: row.related_stocks ? JSON.parse(row.related_stocks as string) : undefined,
      createdAt: row.created_at as string,
    };
  }
}
