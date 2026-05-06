import { BaseAdapter } from './base.js';
import type { FetchParams, RawHotItem, HotItem } from '@webhot/schemas';

interface HNItem {
  id: number;
  title?: string;
  url?: string;
  score?: number;
  by?: string;
  descendants?: number;
  time?: number;
  type?: string;
}

/**
 * Hacker News 适配器
 * 使用 Hacker News 官方 Firebase API
 * 先获取 top stories ID 列表，再批量获取详情
 */
export class HackerNewsAdapter extends BaseAdapter {
  id = 'hackernews';
  name = 'Hacker News';
  type = 'api' as const;

  private baseUrl = 'https://hacker-news.firebaseio.com/v0';

  async fetchList(_params: FetchParams): Promise<RawHotItem[]> {
    try {
      // 获取 top stories ID
      const topRes = await fetch(`${this.baseUrl}/topstories.json`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!topRes.ok) throw new Error(`HTTP ${topRes.status}`);
      const ids = await topRes.json() as number[];
      const topIds = ids.slice(0, 30);

      // 批量获取详情
      const items = await Promise.all(
        topIds.map(async (id) => {
          try {
            const itemRes = await fetch(`${this.baseUrl}/item/${id}.json`, {
              signal: AbortSignal.timeout(5000),
            });
            if (!itemRes.ok) return null;
            return await itemRes.json() as HNItem;
          } catch {
            return null;
          }
        })
      );

      return items
        .filter((item): item is HNItem => item !== null && item.type === 'story')
        .map((item, i) => ({
          id: `hn_${item.id}`,
          title: item.title || '',
          url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
          summary: `${item.score || 0} points, ${item.descendants || 0} comments`,
          author: item.by,
          rank: i + 1,
          heatScore: Math.min(100, (item.score || 0) / 5),
          metrics: {
            likes: item.score || 0,
            comments: item.descendants || 0,
          },
          publishedAt: item.time ? new Date(item.time * 1000).toISOString() : new Date().toISOString(),
          raw: item,
        }));
    } catch (err) {
      console.error('[HackerNews] fetch error:', (err as Error).message);
      return [];
    }
  }

  normalize(raw: RawHotItem): HotItem {
    return {
      id: (raw.id as string) || this.generateId('hackernews', 'web', raw.title),
      source: 'hackernews',
      platform: 'hackernews',
      title: raw.title,
      summary: raw.summary,
      url: raw.url || '',
      author: raw.author as string | undefined,
      rank: raw.rank as number | undefined,
      heatScore: raw.heatScore as number | undefined,
      metrics: raw.metrics,
      collectedAt: new Date().toISOString(),
      language: 'en',
      region: 'global',
      raw: raw.raw,
    };
  }
}
