import { BaseAdapter } from './base.js';
import type { FetchParams, RawHotItem, HotItem } from '@webhot/schemas';

interface GithubRepo {
  name?: string;
  full_name?: string;
  description?: string;
  html_url?: string;
  language?: string;
  stargazers_count?: number;
  forks_count?: number;
}

/**
 * GitHub Trending 适配器
 * 使用 GitHub Search API 获取热门仓库
 */
export class GitHubTrendingAdapter extends BaseAdapter {
  id = 'github_trending';
  name = 'GitHub Trending';
  type = 'api' as const;

  private endpoint = 'https://api.github.com/search/repositories';
  private language: string;

  constructor(language: string = '') {
    super();
    this.language = language;
  }

  async fetchList(_params: FetchParams): Promise<RawHotItem[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const q = `created:>=${today}` + (this.language ? `+language:${this.language}` : '');
      const url = `${this.endpoint}?q=${q}&sort=stars&order=desc&per_page=30`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'WebHot/0.1', 'Accept': 'application/vnd.github.v3+json' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json() as { items?: GithubRepo[] };
      const repos = body.items || [];

      return repos.map((repo, i) => ({
        id: `gh_${repo.full_name || repo.name}`,
        title: repo.full_name || repo.name || '',
        url: repo.html_url || '',
        summary: repo.description || '',
        author: repo.full_name?.split('/')[0],
        rank: i + 1,
        heatScore: Math.min(100, (repo.stargazers_count || 0) / 10),
        metrics: {
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
        },
        publishedAt: new Date().toISOString(),
        raw: repo,
      }));
    } catch (err) {
      console.error('[GitHubTrending] fetch error:', (err as Error).message);
      return [];
    }
  }

  normalize(raw: RawHotItem): HotItem {
    return {
      id: (raw.id as string) || this.generateId('github', 'trending', raw.title),
      source: 'github_trending',
      platform: 'github',
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
