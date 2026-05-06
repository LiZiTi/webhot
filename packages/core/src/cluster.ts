import type { HotItem, TopicCluster } from '@webhot/schemas';
import { TopicRepo } from '@webhot/storage';

/**
 * 轻量级 Topic 聚类引擎
 *
 * 不使用向量嵌入 / GraphRAG，而是基于：
 * 1. 标题分词 Jaccard 相似度
 * 2. 共享标签/关键词共现
 * 3. 时间窗口聚合
 *
 * 优点：零外部依赖、速度快、可解释
 */

// 中文 + 英文分词 (简单版 — 基于字符 n-gram 和空格分词)
function tokenize(text: string): Set<string> {
  const cleaned = text.toLowerCase()
    .replace(/[^\w一-鿿\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = new Set<string>();

  // 英文/数字词
  for (const word of cleaned.split(/\s+/)) {
    if (word.length >= 2) tokens.add(word);
  }

  // 中文 bigram
  const chineseChars = text.replace(/[^一-鿿]/g, '');
  for (let i = 0; i < chineseChars.length - 1; i++) {
    tokens.add(chineseChars.substring(i, i + 2));
  }

  // 同时加入 trigram 提高精度
  for (let i = 0; i < chineseChars.length - 2; i++) {
    tokens.add(chineseChars.substring(i, i + 3));
  }

  return tokens;
}

/** Jaccard 相似度 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  return intersection.size / union.size;
}

/** 标签重叠度 */
function tagOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const overlap = a.filter(t => setB.has(t)).length;
  const maxLen = Math.max(a.length, b.length);
  return maxLen > 0 ? overlap / maxLen : 0;
}

interface ClusterCandidate {
  items: HotItem[];
  centroid: Set<string>;
  allTags: Set<string>;
}

export class LightweightClusterEngine {
  private topicRepo: TopicRepo;

  constructor() {
    this.topicRepo = new TopicRepo();
  }

  /**
   * 对一批 HotItem 进行聚类
   * @param items 待聚类条目
   * @param similarityThreshold Jaccard 相似度阈值 (默认 0.35)
   * @param tagWeight 标签权重 (0-1)
   */
  cluster(items: HotItem[], similarityThreshold: number = 0.35, tagWeight: number = 0.3): TopicCluster[] {
    if (items.length === 0) return [];

    // 为每个 item 构建 token set
    const tokenized = items.map(item => ({
      item,
      tokens: tokenize(`${item.title} ${item.summary || ''}`),
      tags: item.tags || [],
    }));

    // 贪心聚类
    const clusters: ClusterCandidate[] = [];

    for (const entry of tokenized) {
      let bestMatch: ClusterCandidate | null = null;
      let bestScore = 0;

      for (const cluster of clusters) {
        const jacScore = jaccardSimilarity(entry.tokens, cluster.centroid);
        const tagScore = tagOverlap(entry.tags, Array.from(cluster.allTags));
        const combinedScore = jacScore * (1 - tagWeight) + tagScore * tagWeight;

        if (combinedScore > similarityThreshold && combinedScore > bestScore) {
          bestScore = combinedScore;
          bestMatch = cluster;
        }
      }

      if (bestMatch) {
        bestMatch.items.push(entry.item);
        // 更新 centroid（合并 token）
        bestMatch.centroid = new Set([...bestMatch.centroid, ...entry.tokens]);
        entry.tags.forEach(t => bestMatch!.allTags.add(t));
      } else {
        clusters.push({
          items: [entry.item],
          centroid: new Set(entry.tokens),
          allTags: new Set(entry.tags),
        });
      }
    }

    // 转换为 TopicCluster 格式并保存
    const results: TopicCluster[] = clusters
      .filter(c => c.items.length >= 1)
      .map((c, i) => {
        const mainItem = c.items[0];
        const allTitles = c.items.map(it => it.title);
        const representativeTitle = this._pickRepresentativeTitle(allTitles);
        const allPlatforms = [...new Set(c.items.map(it => it.platform))];
        const category = mainItem.categories?.[0] || 'Technology';

        const cluster: TopicCluster = {
          id: `cluster_${Date.now()}_${i}`,
          title: representativeTitle,
          aliases: allTitles.filter(t => t !== representativeTitle).slice(0, 5),
          category,
          hotItems: c.items.map(it => it.id),
          trendScore: c.items.reduce((sum, it) => sum + (it.trendScore || 0), 0) / c.items.length,
          growthScore: c.items.length * (c.items.length >= 2 ? 2 : 1),
          platforms: allPlatforms,
          relatedStocks: mainItem.tags?.filter(t =>
            ['hbm', 'gpu', 'nvidia', 'semiconductor', 'chip'].includes(t.toLowerCase())
          ),
          createdAt: new Date().toISOString(),
        };

        // 写入数据库
        this.topicRepo.upsert(cluster);

        return cluster;
      });

    return results;
  }

  /** 从标题列表中选最长的作为代表标题（或最短的，视策略而定） */
  private _pickRepresentativeTitle(titles: string[]): string {
    // 选中等长度标题作为代表作
    const sorted = [...titles].sort((a, b) => a.length - b.length);
    const median = sorted[Math.floor(sorted.length / 2)];
    return median || titles[0];
  }
}
