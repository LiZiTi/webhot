import { BaseAdapter } from './base.js';
import type { FetchParams, RawHotItem, HotItem } from '@webhot/schemas';

/**
 * TopHub 适配器 — 解析 TopHub HTML 页面
 * TopHub 是一个热榜聚合网站，HTML 中包含各平台热榜
 */
export class TopHubAdapter extends BaseAdapter {
  id = 'tophub';
  name = 'TopHub';
  type = 'html' as const;

  private endpoint: string;

  constructor(endpoint: string) {
    super();
    this.endpoint = endpoint;
  }

  async fetchList(_params: FetchParams): Promise<RawHotItem[]> {
    try {
      const res = await fetch(this.endpoint, {
        headers: { 'User-Agent': 'WebHot/0.1', 'Accept': 'text/html' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();

      return this._parseHtml(html);
    } catch (err) {
      console.error('[TopHub] fetch error:', (err as Error).message);
      return [];
    }
  }

  private _parseHtml(html: string): RawHotItem[] {
    // TopHub 使用标准格式：<a> 标签包含 title，链接包含 rank info
    // 匹配常见的 TopHub 表格行格式
    const items: RawHotItem[] = [];
    const seen = new Set<string>();

    // 匹配 <a> 标签中的链接和标题 (TopHub 标准格式)
    const linkRegex = /<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    let index = 0;

    while ((match = linkRegex.exec(html)) !== null && index < 100) {
      let url = match[1].trim();
      const titleRaw = match[2].replace(/<[^>]*>/g, '').trim();

      if (!titleRaw || titleRaw.length < 2 || titleRaw.length > 200) continue;
      if (seen.has(titleRaw)) continue;

      // 构建完整 URL
      if (url.startsWith('/')) {
        url = new URL(url, this.endpoint).href;
      }

      if (!url.startsWith('http')) continue;

      seen.add(titleRaw);
      items.push({
        id: this.generateId('tophub', 'web', titleRaw),
        title: titleRaw,
        url,
        rank: index + 1,
        heatScore: Math.max(0, 100 - index * 2),
        publishedAt: new Date().toISOString(),
        raw: { url, index },
      });
      index++;
    }

    return items;
  }

  normalize(raw: RawHotItem): HotItem {
    return {
      id: (raw.id as string) || this.generateId('tophub', 'web', raw.title),
      source: 'tophub',
      platform: 'web',
      title: raw.title,
      summary: raw.summary,
      url: raw.url || '',
      rank: raw.rank as number | undefined,
      heatScore: raw.heatScore as number | undefined,
      collectedAt: new Date().toISOString(),
      language: 'zh',
      region: 'cn',
      raw: raw.raw,
    };
  }
}
