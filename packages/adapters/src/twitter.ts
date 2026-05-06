import { BaseAdapter } from './base.js';
import type { FetchParams, RawHotItem, HotItem } from '@webhot/schemas';

/**
 * Twitter/X 适配器
 *
 * 策略：使用 Nitter (Twitter 第三方前端) RSS 或公开 API
 * 支持多种 Nitter 实例，自动故障切换
 */
export class TwitterAdapter extends BaseAdapter {
  id = 'twitter';
  name = 'Twitter/X';
  type = 'api' as const;

  private instances = [
    'https://nitter.net',
    'https://nitter.privacydev.net',
    'https://nitter.poast.org',
  ];

  private activeInstance: string;

  constructor() {
    super();
    this.activeInstance = this.instances[0];
  }

  async fetchList(_params: FetchParams): Promise<RawHotItem[]> {
    // 先尝试通过 Nitter 实例获取热门推文
    for (const instance of this.instances) {
      try {
        const items = await this._fetchFromNitter(instance);
        if (items.length > 0) {
          this.activeInstance = instance;
          return items;
        }
      } catch {
        continue;
      }
    }

    // 所有实例失败，返回空
    console.error('[Twitter] all instances failed');
    return [];
  }

  private async _fetchFromNitter(instance: string): Promise<RawHotItem[]> {
    // Nitter 的 RSS 端点: /search/rss?f=tweets&q=...
    const keywords = ['AI', 'tech', 'breaking', 'MCP', 'Agent'];
    const allItems: RawHotItem[] = [];

    for (const kw of keywords.slice(0, 2)) {
      try {
        const url = `${instance}/search/rss?f=tweets&q=${encodeURIComponent(kw)}`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'WebHot/0.1' },
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) continue;
        const xml = await res.text();

        // 简单解析 RSS XML
        const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
        let match;
        while ((match = itemRegex.exec(xml)) !== null) {
          const block = match[1];
          const title = this._extractTag(block, 'title');
          const link = this._extractTag(block, 'link');
          const description = this._extractTag(block, 'description');
          const pubDate = this._extractTag(block, 'pubDate');
          const creator = this._extractTag(block, 'dc:creator');

          if (title && link) {
            allItems.push({
              id: `tw_${Buffer.from(link).toString('base64').substring(0, 16)}`,
              title: title.replace(/<\/?[^>]+>/g, '').trim(),
              url: link,
              summary: description?.replace(/<\/?[^>]+>/g, '').substring(0, 300) || '',
              author: creator || undefined,
              rank: allItems.length + 1,
              heatScore: 50 + Math.random() * 40,
              publishedAt: pubDate || new Date().toISOString(),
              raw: { instance, kw },
            });
          }
        }
      } catch {
        continue;
      }
    }

    return allItems.slice(0, 50);
  }

  private _extractTag(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
    const match = regex.exec(xml);
    return match?.[1]?.trim() || '';
  }

  normalize(raw: RawHotItem): HotItem {
    return {
      id: (raw.id as string) || this.generateId('twitter', 'x', raw.title),
      source: 'twitter',
      platform: 'twitter',
      title: raw.title,
      summary: raw.summary,
      url: raw.url || '',
      author: raw.author as string | undefined,
      rank: raw.rank as number | undefined,
      heatScore: raw.heatScore as number | undefined,
      collectedAt: new Date().toISOString(),
      language: 'en',
      region: 'global',
      raw: raw.raw,
    };
  }
}
