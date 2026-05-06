import { BaseAdapter } from './base.js';
import type { FetchParams, RawHotItem, HotItem } from '@webhot/schemas';

interface NewsNowApiItem {
  id?: string | number;
  title: string;
  url?: string;
  mobileUrl?: string;
  description?: string;
  hot?: number;
  score?: number;
  rank?: number;
  createdAt?: string;
}

/**
 * NewsNow 适配器 — 接入 NewsNow API 热点数据
 * API 格式: { data: { items: [...] } }
 */
export class NewsNowAdapter extends BaseAdapter {
  id = 'newsnow';
  name = 'NewsNow';
  type = 'api' as const;

  private endpoint: string;
  private platform: string;

  constructor(endpoint: string, platform: string) {
    super();
    this.endpoint = endpoint;
    this.platform = platform;
  }

  async fetchList(_params: FetchParams): Promise<RawHotItem[]> {
    try {
      const res = await fetch(this.endpoint, {
        headers: { 'User-Agent': 'WebHot/0.1', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json() as Record<string, unknown>;

      // NewsNow 返回格式: { data: { items: [...] } } 或直接数组
      const data = (body as any).data || body;
      const items: NewsNowApiItem[] = Array.isArray(data) ? data : (data.items || []);

      return items.map((item, i) => ({
        id: item.id?.toString() || this.generateId('newsnow', this.platform, item.title),
        title: item.title,
        url: item.mobileUrl || item.url || '',
        summary: item.description || '',
        rank: item.rank ?? (i + 1),
        heatScore: item.hot ?? item.score ?? 0,
        publishedAt: item.createdAt || new Date().toISOString(),
        raw: item,
      }));
    } catch (err) {
      console.error(`[NewsNow:${this.platform}] fetch error:`, (err as Error).message);
      return [];
    }
  }

  normalize(raw: RawHotItem): HotItem {
    return {
      id: (raw.id as string) || this.generateId('newsnow', this.platform, raw.title),
      source: 'newsnow',
      platform: this.platform,
      title: raw.title,
      summary: raw.summary,
      url: raw.url || '',
      author: raw.author as string | undefined,
      rank: raw.rank as number | undefined,
      heatScore: raw.heatScore as number | undefined,
      collectedAt: new Date().toISOString(),
      language: 'zh',
      region: 'cn',
      raw: raw.raw,
    };
  }
}
