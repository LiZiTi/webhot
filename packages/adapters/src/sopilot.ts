import { XMLParser } from 'fast-xml-parser';
import { BaseAdapter } from './base.js';
import type { FetchParams, RawHotItem, HotItem } from '@webhot/schemas';

interface RssItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  'dc:creator'?: string;
  author?: string;
  category?: string | string[];
  guid?: string;
}

interface RssFeed {
  rss?: {
    channel?: {
      item?: RssItem[];
    };
  };
}

/**
 * SoPilot RSS 适配器 — 解析 RSS/Atom 格式热点
 */
export class SoPilotAdapter extends BaseAdapter {
  id = 'sopilot';
  name = 'SoPilot';
  type = 'rss' as const;

  private endpoint: string;
  private parser: XMLParser;

  constructor(endpoint: string) {
    super();
    this.endpoint = endpoint;
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      textNodeName: '#text',
    });
  }

  async fetchList(_params: FetchParams): Promise<RawHotItem[]> {
    try {
      const res = await fetch(this.endpoint, {
        headers: { 'User-Agent': 'WebHot/0.1', 'Accept': 'application/rss+xml, application/xml, text/xml' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();

      const feed = this.parser.parse(xml) as RssFeed;
      const items = feed?.rss?.channel?.item || [];

      return items.map((item, i) => {
        const title = item.title?.trim() || '';
        const link = item.link || '';
        const description = item.description || '';
        const pubDate = item.pubDate || new Date().toISOString();
        const author = item['dc:creator'] || item.author;

        return {
          id: item.guid || this.generateId('sopilot', 'rss', title),
          title,
          url: link,
          summary: description.replace(/<[^>]*>/g, '').substring(0, 500),
          author: author || undefined,
          rank: i + 1,
          heatScore: Math.max(0, 80 - i * 3),
          publishedAt: pubDate,
          raw: item,
        };
      });
    } catch (err) {
      console.error('[SoPilot] fetch error:', (err as Error).message);
      return [];
    }
  }

  normalize(raw: RawHotItem): HotItem {
    return {
      id: (raw.id as string) || this.generateId('sopilot', 'rss', raw.title),
      source: 'sopilot',
      platform: 'rss',
      title: raw.title,
      summary: raw.summary,
      url: raw.url || '',
      author: raw.author as string | undefined,
      rank: raw.rank as number | undefined,
      heatScore: raw.heatScore as number | undefined,
      collectedAt: new Date().toISOString(),
      language: 'zh',
      region: 'global',
      raw: raw.raw,
    };
  }
}
