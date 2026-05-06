import { BaseAdapter } from './base.js';
import type { FetchParams, RawHotItem, HotItem } from '@webhot/schemas';

interface RedditPost {
  data: {
    id: string;
    title: string;
    url?: string;
    permalink?: string;
    selftext?: string;
    author?: string;
    score?: number;
    num_comments?: number;
    ups?: number;
    created_utc?: number;
    subreddit?: string;
  };
}

/**
 * Reddit 适配器
 * 使用 Reddit 公开 JSON API (.json)
 */
export class RedditAdapter extends BaseAdapter {
  id = 'reddit';
  name = 'Reddit';
  type = 'api' as const;

  private subreddit: string;
  private sort: string;

  constructor(subreddit: string = 'programming', sort: string = 'hot') {
    super();
    this.subreddit = subreddit;
    this.sort = sort;
  }

  async fetchList(_params: FetchParams): Promise<RawHotItem[]> {
    try {
      const url = `https://www.reddit.com/r/${this.subreddit}/${this.sort}.json?limit=30`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'WebHot/0.1 (trending data collector)' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json() as { data?: { children?: RedditPost[] } };
      const posts = body?.data?.children || [];

      return posts.map((post, i) => {
        const d = post.data;
        return {
          id: `reddit_${d.id}`,
          title: d.title,
          url: d.url || `https://reddit.com${d.permalink}`,
          summary: d.selftext?.substring(0, 300) || '',
          author: d.author,
          rank: i + 1,
          heatScore: Math.min(100, (d.score || d.ups || 0) / 10),
          metrics: {
            likes: d.ups || d.score || 0,
            comments: d.num_comments || 0,
          },
          publishedAt: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : new Date().toISOString(),
          raw: d,
        };
      });
    } catch (err) {
      console.error('[Reddit] fetch error:', (err as Error).message);
      return [];
    }
  }

  normalize(raw: RawHotItem): HotItem {
    return {
      id: (raw.id as string) || this.generateId('reddit', this.subreddit, raw.title),
      source: 'reddit',
      platform: `reddit/r/${this.subreddit}`,
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
