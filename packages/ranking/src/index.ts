import type { HotItem } from '@webhot/schemas';

/**
 * Ranking Engine — 多维度热度评分
 *
 * 评分维度：
 * - 平台权重 (platformWeight)      25%
 * - 金融相关性 (financeWeight)     15%
 * - AI 相关性 (aiWeight)          10%
 * - 互动量 (engagement)           15%
 * - 原始热度 (rawHeat)            15%
 * - 趋势/增速 (trendWeight)       20%
 */

// 平台基础权重
const PLATFORM_WEIGHTS: Record<string, number> = {
  twitter: 3.0, github: 2.5, weibo: 2.0, zhihu: 1.8, reddit: 1.5,
  hackernews: 1.5, v2ex: 1.0, bilibili: 1.2, rss: 0.8, web: 0.5,
  finance: 2.0, trending: 1.5,
};

// AI 相关关键词
const AI_KEYWORDS = [
  'mcp', 'agent', 'openai', 'claude', 'cursor', 'deepseek', 'langgraph', 'autogpt',
  'llm', 'gpt', 'copilot', 'ai agent', 'ai coding', 'ai tool', 'artificial intelligence',
];

// 金融相关关键词
const FINANCE_KEYWORDS = [
  'stock', '股票', 'market', '市场', 'etf', 'ipo', 'a股', '半导体', 'semiconductor',
  'hbm', 'gpu', 'nvidia', '英伟达', '存储', '涨价', '算力', 'datacenter', '数据中心',
  '产业链', 'supply chain', '芯片', 'chip', '台积电', 'tsmc',
];

export class RankingEngine {
  // 排名历史追踪（用于计算趋势）
  private rankHistory: Map<string, number> = new Map();

  /**
   * 计算综合热度评分 (0-100)
   */
  score(item: HotItem): number {
    const previousRank = this.rankHistory.get(item.id);
    const trend = this.trendScore(item.rank, previousRank);

    const scores = [
      this.platformScore(item.platform) * 0.25,
      this.financeRelevance(item.title, item.summary || '') * 0.15,
      this.aiRelevance(item.title, item.summary || '') * 0.10,
      this.engagementScore(item.metrics) * 0.15,
      (item.heatScore || 0) / 100 * 0.15,
      trend * 0.20,
    ];
    return Math.round(scores.reduce((a, b) => a + b, 0) * 100);
  }

  /**
   * 平台权重评分 (0-1)
   */
  platformScore(platform: string): number {
    const weight = PLATFORM_WEIGHTS[platform.toLowerCase()] || 0.5;
    return Math.min(1, weight / 3.0);
  }

  /**
   * 金融相关性评分 (0-1)
   */
  financeRelevance(title: string, summary: string): number {
    const text = `${title} ${summary}`.toLowerCase();
    const matches = FINANCE_KEYWORDS.filter(k => text.includes(k.toLowerCase()));
    return Math.min(1, matches.length * 0.15);
  }

  /**
   * AI 相关性评分 (0-1)
   */
  aiRelevance(title: string, summary: string): number {
    const text = `${title} ${summary}`.toLowerCase();
    const matches = AI_KEYWORDS.filter(k => text.includes(k.toLowerCase()));
    return Math.min(1, matches.length * 0.12);
  }

  /**
   * 互动量评分 (0-1)
   */
  engagementScore(metrics?: HotItem['metrics']): number {
    if (!metrics) return 0;
    const total = (metrics.views || 0) * 0.001 +
                  (metrics.likes || 0) * 0.05 +
                  (metrics.comments || 0) * 0.15 +
                  (metrics.shares || 0) * 0.3 +
                  (metrics.stars || 0) * 0.1;
    return Math.min(1, total / 100);
  }

  /**
   * 计算趋势分数 (0-1)
   * 排名上升 → 高趋势分；排名下降 → 低趋势分
   */
  trendScore(currentRank?: number, previousRank?: number): number {
    if (currentRank == null || previousRank == null) return 0.5; // 新条目默认中等
    if (previousRank === currentRank) return 0.4;
    const delta = previousRank - currentRank; // 正=上升，负=下降
    // tanh 归一化: 排名上升 50 位 ≈ 趋势分 1.0
    const normalized = Math.tanh(delta / 15);
    // 映射到 0-1 范围
    return (normalized + 1) / 2;
  }

  /**
   * 对热点列表排序并打分
   */
  rank(items: HotItem[]): HotItem[] {
    const scored = items.map(item => {
      // 先保留当前排名到历史中
      const currentRank = item.rank;
      const previousRank = this.rankHistory.get(item.id);

      const heatScore = this.score(item);
      const trendScore = this.trendScore(currentRank, previousRank);
      const aiScore = this.aiRelevance(item.title, item.summary || '') * 100;
      const financeScore = this.financeRelevance(item.title, item.summary || '') * 100;

      // 更新排名历史
      if (currentRank != null) {
        this.rankHistory.set(item.id, currentRank);
      }

      return {
        ...item,
        heatScore,
        trendScore: trendScore * 100,
        aiScore,
        financeScore,
      };
    });

    return scored.sort((a, b) => (b.heatScore || 0) - (a.heatScore || 0));
  }
}
