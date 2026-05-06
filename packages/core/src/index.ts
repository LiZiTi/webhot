// WebHot Core — 核心编排层
// 将各 Engine 连接起来，对外提供统一查询接口

import type { HotItem, TopicCluster, WorldState, Signal, TopicTimeline, Category } from '@webhot/schemas';
import { HotItemRepo, TopicRepo, runMigrations } from '@webhot/storage';
import { RankingEngine } from '@webhot/ranking';
import { SemanticEngine } from '@webhot/semantic';
import { SignalEngine } from '@webhot/signal';
import { TimelineEngine } from '@webhot/timeline';
import { PerceptionEngine } from '@webhot/perception';
import { LightweightClusterEngine } from './cluster.js';

export class WebHotCore {
  hotItemRepo: HotItemRepo;
  topicRepo: TopicRepo;
  ranking: RankingEngine;
  semantic: SemanticEngine;
  signal: SignalEngine;
  timeline: TimelineEngine;
  perception: PerceptionEngine;
  cluster: LightweightClusterEngine;

  constructor() {
    runMigrations();
    this.hotItemRepo = new HotItemRepo();
    this.topicRepo = new TopicRepo();
    this.ranking = new RankingEngine();
    this.semantic = new SemanticEngine();
    this.signal = new SignalEngine();
    this.timeline = new TimelineEngine();
    this.perception = new PerceptionEngine();
    this.cluster = new LightweightClusterEngine();
  }

  /**
   * 采集并处理新热点
   */
  ingest(items: HotItem[]): HotItem[] {
    // 1. 语义分析
    const analyzed = items.map(item => this.semantic.analyze(item));
    // 2. 评分
    const ranked = this.ranking.rank(analyzed);
    // 3. 感知引擎摄入
    this.perception.ingest(ranked);

    // 4. 轻量级 Topic 聚类
    if (ranked.length >= 3) {
      this.cluster.cluster(ranked, 0.35, 0.3);
    }

    // 5. 信号检测
    for (const item of ranked) {
      const growthRate = ((item.trendScore || 0) + 1) / 10;
      this.signal.detectExplosion(item, growthRate);
      this.signal.detectAI(item, item.aiScore || 0);
      this.signal.detectFinance(item, item.financeScore || 0);
      this.signal.detectRisk(item);
    }

    // 6. 时间线记录
    for (const item of ranked) {
      this.timeline.recordEvent(item, item.id);
    }

    return ranked;
  }

  /**
   * 获取热点列表
   */
  getHotList(params: {
    category?: string;
    platform?: string;
    limit?: number;
  }): { items: HotItem[]; total: number } {
    let items: HotItem[];
    if (params.platform) {
      items = this.hotItemRepo.findByPlatform(params.platform, params.limit || 30);
    } else if (params.category) {
      items = this.hotItemRepo.findByCategory(params.category, params.limit || 30);
    } else {
      items = this.hotItemRepo.findRecent(params.limit || 30);
    }
    return { items, total: items.length };
  }

  /**
   * 搜索热点
   */
  searchHot(query: string, limit: number = 20): { items: HotItem[]; total: number } {
    const items = this.hotItemRepo.search(query, limit);
    return { items, total: items.length };
  }

  /**
   * 获取升温最快的主题
   */
  getTrendingTopics(category?: string, limit: number = 10): TopicCluster[] {
    if (category) {
      return this.topicRepo.findByCategory(category, limit);
    }
    return this.topicRepo.findTrending(limit);
  }

  /**
   * 获取话题时间线
   */
  getTopicTimeline(topicId: string): TopicTimeline {
    return this.timeline.getTimeline(topicId);
  }

  /**
   * 获取金融信号
   */
  getFinanceSignals(limit: number = 10): Signal[] {
    return this.signal.getSignalsByType('finance', limit);
  }

  /**
   * 获取 AI 趋势信号
   */
  getAISignals(limit: number = 10): Signal[] {
    return this.signal.getSignalsByType('ai', limit);
  }

  /**
   * 获取当前世界状态
   */
  getWorldState(): WorldState {
    return {
      activeTopics: this.topicRepo.findTrending(10),
      trendingTopics: this.topicRepo.findTrending(20),
      explodingTopics: this.topicRepo.findExploding(5),
      financeTopics: this.topicRepo.findByCategory('Finance', 10),
      aiTopics: this.topicRepo.findByCategory('AI', 10),
      riskTopics: [], // 风险主题暂由 Signal 层管理
      lastUpdatedAt: new Date().toISOString(),
    };
  }
}

// 重新导出类型
export { type HotItem, type TopicCluster, type WorldState, type Signal, type TopicTimeline, type Category } from '@webhot/schemas';
export type { WorldChange } from '@webhot/storage';
