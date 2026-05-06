import type { HotSourceAdapter, FetchParams, RawHotItem, HotItem } from '@webhot/schemas';

export abstract class BaseAdapter implements HotSourceAdapter {
  abstract id: string;
  abstract name: string;
  abstract type: 'api' | 'rss' | 'html' | 'browser';

  abstract fetchList(params: FetchParams): Promise<RawHotItem[]>;
  abstract normalize(raw: RawHotItem): HotItem;

  async healthcheck(): Promise<boolean> {
    try {
      const items = await this.fetchList({ limit: 1 });
      return Array.isArray(items);
    } catch {
      return false;
    }
  }

  protected generateId(source: string, platform: string, title: string): string {
    const key = `${source}:${platform}:${title}`;
    // simple hash
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `hot_${Math.abs(hash).toString(16)}`;
  }
}
