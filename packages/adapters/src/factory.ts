import type { HotSourceAdapter } from '@webhot/schemas';
import { NewsNowAdapter } from './newsnow.js';
import { TopHubAdapter } from './tophub.js';
import { SoPilotAdapter } from './sopilot.js';
import { GitHubTrendingAdapter } from './github_trending.js';
import { HackerNewsAdapter } from './hackernews.js';
import { RedditAdapter } from './reddit.js';
import { TwitterAdapter } from './twitter.js';
import { FinanceNewsAdapter } from './finance_news.js';

export interface SourceConfig {
  id: string;
  adapter: string;
  platform?: string;
  endpoint?: string;
  subreddit?: string;
  language?: string;
  interval?: number;
}

/**
 * 根据配置创建适配器实例
 */
export function createAdapter(config: SourceConfig): HotSourceAdapter | null {
  switch (config.adapter) {
    case 'newsnow':
      return new NewsNowAdapter(config.endpoint || '', config.platform || 'unknown');
    case 'tophub':
      return new TopHubAdapter(config.endpoint || '');
    case 'sopilot':
    case 'rss':
      return new SoPilotAdapter(config.endpoint || '');
    case 'github_trending':
    case 'github':
      return new GitHubTrendingAdapter(config.language);
    case 'hackernews':
    case 'hn':
      return new HackerNewsAdapter();
    case 'reddit':
      return new RedditAdapter(config.subreddit || 'programming');
    case 'twitter':
    case 'x':
      return new TwitterAdapter();
    case 'finance_news':
    case 'finance':
      return new FinanceNewsAdapter();
    case 'browser':
      // Browser adapter — Phase 2 (需要 Playwright)
      console.warn('[adapters] browser adapter not yet implemented, returning null');
      return null;
    default:
      console.error(`[adapters] unknown adapter type: ${config.adapter}`);
      return null;
  }
}

/**
 * 加载 sources.yaml 并创建所有适配器
 */
export function createAdaptersFromConfig(sources: SourceConfig[]): HotSourceAdapter[] {
  return sources
    .map(createAdapter)
    .filter((a): a is HotSourceAdapter => a !== null);
}
