// WebHot Adapters — 数据源适配器集合

export { BaseAdapter } from './base.js';
export { NewsNowAdapter } from './newsnow.js';
export { TopHubAdapter } from './tophub.js';
export { SoPilotAdapter } from './sopilot.js';
export { GitHubTrendingAdapter } from './github_trending.js';
export { HackerNewsAdapter } from './hackernews.js';
export { RedditAdapter } from './reddit.js';
export { TwitterAdapter } from './twitter.js';
export { FinanceNewsAdapter } from './finance_news.js';
export { createAdapter, createAdaptersFromConfig } from './factory.js';
export type { SourceConfig } from './factory.js';
export type { HotSourceAdapter } from '@webhot/schemas';
