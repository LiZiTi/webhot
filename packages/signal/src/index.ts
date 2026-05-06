import type { Signal, SignalType, HotItem } from '@webhot/schemas';
import { SignalRepo } from '@webhot/storage';
import { v4 as uuid } from 'uuid';

/**
 * Signal Engine — 信号引擎
 *
 * 核心职责：
 * 1. 判断热点是否应该通知 Agent
 * 2. 产生不同类型的 Signal
 * 3. Signal 才是 Agent 真正需要消费的数据
 */

export class SignalEngine {
  private repo: SignalRepo;

  constructor() {
    this.repo = new SignalRepo();
  }

  /**
   * 检测爆发信号：热度增长率超过阈值
   */
  detectExplosion(item: HotItem, growthRate: number): Signal | null {
    if (growthRate > 5.0) { // 500%+ 增长
      return this._createSignal('explosion', item, growthRate * 100,
        `急剧爆发：${item.title}，增长 ${(growthRate * 100).toFixed(0)}%`);
    }
    return null;
  }

  /**
   * 检测跨平台扩散信号
   */
  detectCrossPlatform(item: HotItem, platforms: string[]): Signal | null {
    if (platforms.length >= 3) {
      return this._createSignal('cross_platform', item, platforms.length * 30,
        `跨平台扩散：${item.title} 已扩散至 ${platforms.join(', ')}`);
    }
    return null;
  }

  /**
   * 检测金融信号
   */
  detectFinance(item: HotItem, relevance: number): Signal | null {
    if (relevance > 50) {
      return this._createSignal('finance', item, relevance,
        `金融相关热点：${item.title}，相关度 ${relevance.toFixed(0)}`);
    }
    return null;
  }

  /**
   * 检测 AI 信号
   */
  detectAI(item: HotItem, relevance: number): Signal | null {
    if (relevance > 50) {
      return this._createSignal('ai', item, relevance,
        `AI 相关热点：${item.title}，相关度 ${relevance.toFixed(0)}`);
    }
    return null;
  }

  /**
   * 检测风险信号
   */
  detectRisk(item: HotItem): Signal | null {
    const text = `${item.title} ${item.summary || ''}`;
    const riskKeywords = ['暴跌', '崩盘', '泡沫', '危机', 'crash', 'hack', '漏洞', 'CVE'];
    const matches = riskKeywords.filter(k => text.toLowerCase().includes(k.toLowerCase()));

    if (matches.length > 0) {
      return this._createSignal('risk', item, matches.length * 40,
        `风险警示：${item.title}，匹配关键词：${matches.join(', ')}`);
    }
    return null;
  }

  /**
   * 获取指定类型的信号
   */
  getSignalsByType(type: SignalType, limit: number = 20): Signal[] {
    return this.repo.findByType(type, limit);
  }

  /**
   * 获取最近所有信号
   */
  getRecentSignals(limit: number = 30): Signal[] {
    return this.repo.findRecent(limit);
  }

  getSignalsByTopic(topicId: string): Signal[] {
    return this.repo.findByTopic(topicId);
  }

  private _createSignal(type: SignalType, item: HotItem, score: number, description: string): Signal {
    const signal: Signal = {
      id: uuid(),
      type,
      topicId: item.id,
      title: item.title,
      score: Math.min(100, score),
      description,
      platforms: [item.platform],
      triggeredAt: new Date().toISOString(),
    };
    this.repo.insert(signal);
    return signal;
  }
}
