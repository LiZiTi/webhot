import { BaseAdapter } from './base.js';
import type { FetchParams, RawHotItem, HotItem } from '@webhot/schemas';

/**
 * 财经新闻适配器
 *
 * 支持多个中文财经 RSS 源：
 * - 财联社 (cls.cn)
 * - 东方财富 (eastmoney)
 * - 华尔街见闻 (wallstreetcn)
 */
export class FinanceNewsAdapter extends BaseAdapter {
  id = 'finance_news';
  name = '财经新闻';
  type = 'rss' as const;

  private feeds = [
    {
      id: 'cls',
      url: 'https://www.cls.cn/api/sw?app=CailianpressWeb&os=web&sv=8.4.6',
      parser: 'api' as const,
    },
    {
      id: 'eastmoney_yaowen',
      url: 'https://finance.eastmoney.com/a/czqyw.html',
      parser: 'html' as const,
    },
  ];

  async fetchList(_params: FetchParams): Promise<RawHotItem[]> {
    const allItems: RawHotItem[] = [];

    for (const feed of this.feeds) {
      try {
        if (feed.parser === 'api') {
          const items = await this._fetchClsApi(feed);
          allItems.push(...items);
        } else {
          const items = await this._fetchEastmoneyHtml(feed);
          allItems.push(...items);
        }
      } catch {
        continue;
      }
    }

    return allItems.slice(0, 50);
  }

  private async _fetchClsApi(feed: { url: string; id: string }): Promise<RawHotItem[]> {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'WebHot/0.1', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const body = await res.json() as any;
    const items = body?.data?.roll_data || body?.data || [];

    return (Array.isArray(items) ? items : []).slice(0, 30).map((item: any, i: number) => ({
      id: `cls_${item.id || i}`,
      title: item.title || item.art_title || '',
      url: item.url || item.art_url || '',
      summary: item.brief || item.content?.substring(0, 200) || '',
      rank: i + 1,
      heatScore: Math.max(0, 80 - i * 2),
      publishedAt: item.ctime ? new Date(item.ctime * 1000).toISOString() : new Date().toISOString(),
      raw: item,
    }));
  }

  private async _fetchEastmoneyHtml(_feed: { url: string }): Promise<RawHotItem[]> {
    // 东方财富 HTML 页面抓取
    const res = await fetch('https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f3,f12,f14&secids=1.000001,0.399001,1.000300,0.399006', {
      headers: { 'User-Agent': 'WebHot/0.1' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];

    // 获取财经快讯
    const newsRes = await fetch('https://np-listapi.eastmoney.com/comm/web/getNewsByColumn?client=web&columnId=102&pageSize=20', {
      headers: { 'User-Agent': 'WebHot/0.1', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!newsRes.ok) return [];

    const body = await newsRes.json() as any;
    const items = body?.data?.list || [];

    return items.map((item: any, i: number) => ({
      id: `em_${item.newsId || i}`,
      title: item.title || '',
      url: item.url || `https://finance.eastmoney.com/a/${item.newsId}.html`,
      summary: item.digest || item.content?.substring(0, 200) || '',
      rank: i + 1,
      heatScore: Math.max(0, 75 - i * 2),
      publishedAt: item.showTime || new Date().toISOString(),
      raw: item,
    }));
  }

  normalize(raw: RawHotItem): HotItem {
    return {
      id: (raw.id as string) || this.generateId('finance_news', 'cn', raw.title),
      source: 'finance_news',
      platform: 'finance',
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
