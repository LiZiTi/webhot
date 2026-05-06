import type { HotItem, HotSnapshot } from '@webhot/schemas';
import { SnapshotRepo, HotItemRepo } from '@webhot/storage';

/**
 * Perception Engine — 感知引擎
 *
 * 核心职责：
 * 1. 接收标准化 HotItem → 生成 Snapshot
 * 2. 对比历史 Snapshot → 检测变化
 * 3. 输出 Diff 结果
 */

export class PerceptionEngine {
  private snapshotRepo: SnapshotRepo;
  private hotItemRepo: HotItemRepo;

  constructor() {
    this.snapshotRepo = new SnapshotRepo();
    this.hotItemRepo = new HotItemRepo();
  }

  /**
   * 采集: 将 HotItem 写入存储 + 生成快照
   */
  ingest(hotItems: HotItem[]): void {
    // 写入热点条目
    this.hotItemRepo.insertMany(hotItems);

    // 生成快照
    const now = new Date().toISOString();
    const snapshots: HotSnapshot[] = hotItems.map(item => ({
      id: `snap_${item.id}_${Date.now()}`,
      source: item.source,
      platform: item.platform,
      topicId: item.id,
      title: item.title,
      heatScore: item.heatScore || 0,
      trendScore: item.trendScore,
      rank: item.rank,
      collectedAt: now,
      metrics: item.metrics,
    }));

    this.snapshotRepo.insertMany(snapshots);
  }

  /**
   * Diff: 检测热度变化
   * 返回热度增长最快的条目
   */
  detectHeatSurge(source: string, minGrowthRate: number = 0.5): Array<{
    itemId: string;
    title: string;
    growthRate: number;
  }> {
    const recent = this.hotItemRepo.findRecent(100);
    const surgeItems: Array<{ itemId: string; title: string; growthRate: number }> = [];

    for (const item of recent) {
      if (item.source !== source) continue;

      const snapshots = this.snapshotRepo.findByTopic(item.id);
      if (snapshots.length < 2) continue;

      const oldest = snapshots[0];
      const newest = snapshots[snapshots.length - 1];
      const oldHeat = oldest.heatScore || 0;
      const newHeat = newest.heatScore || 0;

      if (oldHeat === 0) continue;

      const growthRate = (newHeat - oldHeat) / oldHeat;
      if (growthRate > minGrowthRate) {
        surgeItems.push({ itemId: item.id, title: item.title, growthRate });
      }
    }

    return surgeItems.sort((a, b) => b.growthRate - a.growthRate);
  }

  /**
   * 检测新出现的热点（之前未出现过的标题）
   */
  detectNewHot(limit: number = 20): HotItem[] {
    const recent = this.hotItemRepo.findRecent(200);
    // 找到最近 10 分钟内首次出现的条目
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    return recent
      .filter(item => item.collectedAt >= tenMinAgo)
      .sort((a, b) => (b.heatScore || 0) - (a.heatScore || 0))
      .slice(0, limit);
  }
}
