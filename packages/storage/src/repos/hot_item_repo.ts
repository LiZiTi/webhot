import { getDb } from '../db.js';
import type { HotItem } from '@webhot/schemas';
import { v4 as uuid } from 'uuid';

export class HotItemRepo {
  insert(item: HotItem): void {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO hot_items (id, source, platform, title, summary, url, author, rank,
        heat_score, trend_score, finance_score, ai_score, categories, tags, metrics,
        published_at, collected_at, language, region, raw)
      VALUES (@id, @source, @platform, @title, @summary, @url, @author, @rank,
        @heatScore, @trendScore, @financeScore, @aiScore, @categories, @tags, @metrics,
        @publishedAt, @collectedAt, @language, @region, @raw)
    `);
    stmt.run({
      id: item.id || uuid(),
      source: item.source,
      platform: item.platform,
      title: item.title,
      summary: item.summary || null,
      url: item.url,
      author: item.author || null,
      rank: item.rank ?? null,
      heatScore: item.heatScore ?? 0,
      trendScore: item.trendScore ?? 0,
      financeScore: item.financeScore ?? 0,
      aiScore: item.aiScore ?? 0,
      categories: item.categories ? JSON.stringify(item.categories) : null,
      tags: item.tags ? JSON.stringify(item.tags) : null,
      metrics: item.metrics ? JSON.stringify(item.metrics) : null,
      publishedAt: item.publishedAt || null,
      collectedAt: item.collectedAt,
      language: item.language || 'zh',
      region: item.region || 'cn',
      raw: item.raw ? JSON.stringify(item.raw) : null,
    });
  }

  insertMany(items: HotItem[]): void {
    const db = getDb();
    const insert = db.prepare(`
      INSERT OR REPLACE INTO hot_items (id, source, platform, title, summary, url, author, rank,
        heat_score, trend_score, finance_score, ai_score, categories, tags, metrics,
        published_at, collected_at, language, region, raw)
      VALUES (@id, @source, @platform, @title, @summary, @url, @author, @rank,
        @heatScore, @trendScore, @financeScore, @aiScore, @categories, @tags, @metrics,
        @publishedAt, @collectedAt, @language, @region, @raw)
    `);
    const tx = db.transaction(() => {
      for (const item of items) {
        insert.run({
          id: item.id || uuid(),
          source: item.source,
          platform: item.platform,
          title: item.title,
          summary: item.summary || null,
          url: item.url,
          author: item.author || null,
          rank: item.rank ?? null,
          heatScore: item.heatScore ?? 0,
          trendScore: item.trendScore ?? 0,
          financeScore: item.financeScore ?? 0,
          aiScore: item.aiScore ?? 0,
          categories: item.categories ? JSON.stringify(item.categories) : null,
          tags: item.tags ? JSON.stringify(item.tags) : null,
          metrics: item.metrics ? JSON.stringify(item.metrics) : null,
          publishedAt: item.publishedAt || null,
          collectedAt: item.collectedAt,
          language: item.language || 'zh',
          region: item.region || 'cn',
          raw: item.raw ? JSON.stringify(item.raw) : null,
        });
      }
    });
    tx();
  }

  findById(id: string): HotItem | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM hot_items WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? this._deserialize(row) : null;
  }

  findRecent(limit: number = 50, offset: number = 0): HotItem[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM hot_items ORDER BY collected_at DESC LIMIT ? OFFSET ?'
    ).all(limit, offset) as Record<string, unknown>[];
    return rows.map(r => this._deserialize(r));
  }

  findByCategory(category: string, limit: number = 30): HotItem[] {
    const db = getDb();
    const rows = db.prepare(
      "SELECT * FROM hot_items WHERE categories LIKE ? ORDER BY heat_score DESC LIMIT ?"
    ).all(`%"${category}"%`, limit) as Record<string, unknown>[];
    return rows.map(r => this._deserialize(r));
  }

  findByPlatform(platform: string, limit: number = 30): HotItem[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM hot_items WHERE platform = ? ORDER BY rank ASC, heat_score DESC LIMIT ?'
    ).all(platform, limit) as Record<string, unknown>[];
    return rows.map(r => this._deserialize(r));
  }

  search(query: string, limit: number = 30): HotItem[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM hot_items WHERE title LIKE ? OR summary LIKE ? ORDER BY heat_score DESC LIMIT ?'
    ).all(`%${query}%`, `%${query}%`, limit) as Record<string, unknown>[];
    return rows.map(r => this._deserialize(r));
  }

  findSince(timestamp: string): HotItem[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM hot_items WHERE collected_at >= ? ORDER BY heat_score DESC'
    ).all(timestamp) as Record<string, unknown>[];
    return rows.map(r => this._deserialize(r));
  }

  private _deserialize(row: Record<string, unknown>): HotItem {
    return {
      id: row.id as string,
      source: row.source as string,
      platform: row.platform as string,
      title: row.title as string,
      summary: row.summary as string | undefined,
      url: row.url as string,
      author: row.author as string | undefined,
      rank: row.rank as number | undefined,
      heatScore: row.heat_score as number | undefined,
      trendScore: row.trend_score as number | undefined,
      financeScore: row.finance_score as number | undefined,
      aiScore: row.ai_score as number | undefined,
      categories: row.categories ? JSON.parse(row.categories as string) : undefined,
      tags: row.tags ? JSON.parse(row.tags as string) : undefined,
      metrics: row.metrics ? JSON.parse(row.metrics as string) : undefined,
      publishedAt: row.published_at as string | undefined,
      collectedAt: row.collected_at as string,
      language: row.language as string | undefined,
      region: row.region as string | undefined,
      raw: row.raw ? JSON.parse(row.raw as string) : undefined,
    };
  }
}
