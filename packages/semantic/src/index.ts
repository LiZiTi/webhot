import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import type { HotItem, Category } from '@webhot/schemas';

/**
 * Semantic Engine — 语义分析引擎
 *
 * 核心职责：
 * 1. 自动分类 (从 categories.yaml 加载关键词)
 * 2. 自动打标签
 * 3. A股映射
 * 4. 风险识别
 */

// 内置回退关键词 (categories.yaml 加载失败时使用)
const FALLBACK_KEYWORDS: Record<string, string[]> = {
  AI: ['llm', 'ai', 'agent', 'openai', 'claude', 'deepseek', 'mcp', 'cursor', 'langgraph',
       'gpt', 'copilot', 'ai agent', 'ai coding', 'artificial intelligence', 'transformer'],
  Finance: ['stock', '股票', 'market', '市场', 'etf', 'ipo', 'a股', '半导体', 'semiconductor',
            'hbm', 'gpu', 'nvidia', '英伟达', '存储', '涨价', '算力', 'datacenter', '台积电'],
  Technology: ['cloud', 'gpu', 'cpu', 'database', 'frontend', 'backend', 'open source',
               'kubernetes', 'docker', 'api', 'devops', 'serverless'],
  Crypto: ['bitcoin', 'ethereum', 'crypto', 'defi', 'web3', 'blockchain', 'nft', 'btc', 'eth'],
  Developer: ['github', 'programming', 'rust', 'typescript', 'python', 'javascript',
              'react', 'vue', 'go', 'java', 'compiler', 'vscode'],
  Business: ['startup', 'funding', 'ipo', 'acquisition', 'revenue', 'layoff', 'ceo', 'vc'],
  Military: ['military', 'defense', 'army', 'war', 'missile', 'drone', '军事', '武器'],
  Energy: ['energy', 'solar', 'battery', 'nuclear', 'oil', 'power', '能源', '光伏'],
};

function loadCategoryKeywords(): Record<string, string[]> {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const configPath = resolve(__dirname, '../../../configs/categories.yaml');
    const raw = readFileSync(configPath, 'utf-8');
    const config = YAML.parse(raw) as { categories?: Record<string, { keywords?: string[] }> };
    if (config?.categories) {
      const result: Record<string, string[]> = {};
      for (const [cat, data] of Object.entries(config.categories)) {
        if (data?.keywords) {
          result[cat] = data.keywords;
        }
      }
      if (Object.keys(result).length > 0) return result;
    }
  } catch {
    // 配置文件不存在或解析失败，使用回退
  }
  return FALLBACK_KEYWORDS;
}

// 运行时加载
let _keywords: Record<string, string[]> | null = null;
function getCategoryKeywords(): Record<string, string[]> {
  if (!_keywords) _keywords = loadCategoryKeywords();
  return _keywords;
}

const A_SHARE_MAPPING: Record<string, string[]> = {
  'hbm': ['存储芯片', '兆易创新', '北京君正'],
  'gpu': ['算力', '海光信息', '寒武纪'],
  'nvidia': ['AI芯片', '寒武纪', '海光信息'],
  'semiconductor': ['半导体', '中芯国际', '北方华创'],
  'datacenter': ['数据中心', '浪潮信息', '曙光数创'],
  'ai': ['AI', '科大讯飞', '商汤'],
};

export class SemanticEngine {
  /**
   * 自动分类 (从 categories.yaml 加载关键词)
   */
  classify(title: string, summary: string): Category[] {
    const text = `${title} ${summary}`.toLowerCase();
    const keywords = getCategoryKeywords();
    const scores: Array<{ category: string; count: number }> = [];

    for (const [category, kws] of Object.entries(keywords)) {
      const matches = kws.filter(k => text.includes(k.toLowerCase()));
      if (matches.length > 0) {
        scores.push({ category, count: matches.length });
      }
    }

    return scores
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(s => s.category as Category);
  }

  /**
   * 自动打标签
   */
  extractTags(title: string, summary: string): string[] {
    const text = `${title} ${summary}`.toLowerCase();
    const keywords = getCategoryKeywords();
    const tags: string[] = [];
    const allKeywords = Object.values(keywords).flat();
    const seen = new Set<string>();
    for (const kw of allKeywords) {
      if (!seen.has(kw) && text.includes(kw.toLowerCase())) {
        tags.push(kw);
        seen.add(kw);
      }
    }
    return tags.slice(0, 10);
  }

  /**
   * A股映射
   */
  mapToAShare(title: string, summary: string): string[] {
    const text = `${title} ${summary}`.toLowerCase();
    const stocks = new Set<string>();
    for (const [keyword, mappings] of Object.entries(A_SHARE_MAPPING)) {
      if (text.includes(keyword)) {
        mappings.forEach(s => stocks.add(s));
      }
    }
    return Array.from(stocks);
  }

  /**
   * 风险识别
   */
  detectRisk(text: string): { riskLevel: 'low' | 'medium' | 'high'; reasons: string[] } {
    const lower = text.toLowerCase();
    const reasons: string[] = [];
    let score = 0;

    // 高风险信号
    const highRisk = ['暴跌', '崩盘', '暴雷', '跑路', 'hack', 'exploit', '0day'];
    const mediumRisk = ['下跌', '亏损', '裁员', 'layoff', 'lawsuit', '调查'];
    const lowRisk = ['波动', '调整', 'volatility', 'correction'];

    highRisk.forEach(k => { if (lower.includes(k)) { score += 30; reasons.push(`高风险词: ${k}`); } });
    mediumRisk.forEach(k => { if (lower.includes(k)) { score += 15; reasons.push(`中等风险词: ${k}`); } });
    lowRisk.forEach(k => { if (lower.includes(k)) { score += 5; reasons.push(`低风险词: ${k}`); } });

    return {
      riskLevel: score >= 30 ? 'high' : score >= 10 ? 'medium' : 'low',
      reasons: reasons.slice(0, 5),
    };
  }

  /**
   * 综合语义分析
   */
  analyze(item: HotItem): HotItem {
    const text = `${item.title} ${item.summary || ''}`;
    const categories = this.classify(item.title, item.summary || '');
    const tags = this.extractTags(item.title, item.summary || '');
    const aShares = this.mapToAShare(item.title, item.summary || '');
    const risk = this.detectRisk(text);

    return {
      ...item,
      categories,
      tags,
    };
  }
}
