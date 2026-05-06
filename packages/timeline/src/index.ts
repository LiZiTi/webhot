import type { HotItem, TimelineEvent, TopicTimeline } from '@webhot/schemas';
import { TimelineRepo } from '@webhot/storage';

/**
 * Timeline Engine — 时间线引擎
 *
 * 核心职责：
 * 1. 追踪话题的演化轨迹
 * 2. 记录首次出现 → 热度变化 → 扩散路径 → 爆发时刻
 * 3. 为 AI Agent 提供"世界是如何变化的"能力
 */
export class TimelineEngine {
  private repo: TimelineRepo;

  constructor() {
    this.repo = new TimelineRepo();
  }

  /**
   * 从 HotItem 记录时间线事件
   */
  recordEvent(hotItem: HotItem, topicId: string): void {
    const event: TimelineEvent & { topicId: string } = {
      topicId,
      time: hotItem.collectedAt,
      platform: hotItem.platform,
      source: hotItem.source,
      title: hotItem.title,
      url: hotItem.url,
      summary: hotItem.summary,
      metrics: {
        heat: hotItem.heatScore,
        views: hotItem.metrics?.views,
        likes: hotItem.metrics?.likes,
      },
    };
    this.repo.insert(event);
  }

  /**
   * 批量记录
   */
  recordEvents(items: HotItem[], topicId: string): void {
    const events: Array<TimelineEvent & { topicId: string }> = items.map(item => ({
      topicId,
      time: item.collectedAt,
      platform: item.platform,
      source: item.source,
      title: item.title,
      url: item.url,
      summary: item.summary,
      metrics: {
        heat: item.heatScore,
        views: item.metrics?.views,
        likes: item.metrics?.likes,
      },
    }));
    this.repo.insertMany(events);
  }

  /**
   * 获取话题完整时间线
   */
  getTimeline(topicId: string): TopicTimeline {
    const events = this.repo.findByTopic(topicId);
    const firstEvent = events[0];
    return {
      topicId,
      title: firstEvent?.title || topicId,
      events,
    };
  }

  /**
   * 分析时间线：找出关键节点
   */
  analyzeTimeline(topicId: string): {
    firstAppearance: TimelineEvent | null;
    peakHeat: TimelineEvent | null;
    crossPlatformSpread: string[];
    duration: number; // seconds
    totalEvents: number;
  } {
    const events = this.repo.findByTopic(topicId);
    if (events.length === 0) {
      return {
        firstAppearance: null,
        peakHeat: null,
        crossPlatformSpread: [],
        duration: 0,
        totalEvents: 0,
      };
    }

    const firstAppearance = events[0];
    const peakHeat = events.reduce((max, e) =>
      ((e.metrics?.heat || 0) > (max.metrics?.heat || 0)) ? e : max
    , events[0]);

    // 跨平台扩散检测
    const platforms = new Set<string>();
    const seen = new Set<string>();
    for (const e of events) {
      if (!seen.has(e.platform) && platforms.size > 0) {
        platforms.add(e.platform);
      }
      seen.add(e.platform);
    }
    const crossPlatformSpread = Array.from(platforms);

    const duration = events.length >= 2
      ? (new Date(events[events.length - 1].time).getTime() - new Date(firstAppearance.time).getTime()) / 1000
      : 0;

    return {
      firstAppearance,
      peakHeat,
      crossPlatformSpread,
      duration,
      totalEvents: events.length,
    };
  }
}
