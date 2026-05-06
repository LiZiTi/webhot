import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { WebHotCore } from '@webhot/core';

const core = new WebHotCore();

const server = new McpServer({
  name: 'webhot',
  version: '0.1.0',
});

// --- MCP Tools ---

server.tool(
  'get_hot_list',
  '获取热点列表。支持按分类和平台过滤。',
  {
    category: z.string().optional().describe('分类，如 AI / Finance / Technology / Crypto / Developer'),
    platform: z.string().optional().describe('平台，如 twitter / weibo / github / reddit'),
    limit: z.number().optional().describe('返回数量，默认 20'),
  },
  async ({ category, platform, limit }) => {
    const result = core.getHotList({ category, platform, limit });
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

server.tool(
  'search_hot',
  '搜索热点（在 WebHot 世界状态中搜索，非普通网页搜索）',
  {
    query: z.string().describe('搜索关键词'),
    limit: z.number().optional().describe('返回数量，默认 20'),
  },
  async ({ query, limit }) => {
    const result = core.searchHot(query, limit);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

server.tool(
  'get_trending_topics',
  '获取升温最快的主题（趋势感知）',
  {
    category: z.string().optional().describe('分类过滤，如 AI / Finance'),
    limit: z.number().optional().describe('返回数量，默认 10'),
  },
  async ({ category, limit }) => {
    const topics = core.getTrendingTopics(category, limit);
    return { content: [{ type: 'text' as const, text: JSON.stringify({ topics }, null, 2) }] };
  },
);

server.tool(
  'get_world_state',
  '获取当前世界热点状态：正在爆发的话题、AI 热点、金融热点、风险事件',
  {},
  async () => {
    const state = core.getWorldState();
    return { content: [{ type: 'text' as const, text: JSON.stringify(state, null, 2) }] };
  },
);

server.tool(
  'get_topic_timeline',
  '获取热点事件时间线，了解话题如何演化：首次出现 → 热度变化 → 扩散路径 → 爆发时刻',
  {
    topic: z.string().describe('话题 ID 或关键词，如 HBM / DeepSeek / MCP'),
  },
  async ({ topic }) => {
    const timeline = core.getTopicTimeline(topic);
    return { content: [{ type: 'text' as const, text: JSON.stringify(timeline, null, 2) }] };
  },
);

server.tool(
  'explain_topic',
  '解释某个热点事件：自动分类、标签、A股映射、风险识别',
  {
    topic: z.string().describe('话题标题或关键词'),
  },
  async ({ topic }) => {
    const searchResult = core.searchHot(topic, 1);
    if (searchResult.items.length > 0) {
      const item = searchResult.items[0];
      const analyzed = core.semantic.analyze(item);
      const risk = core.semantic.detectRisk(`${item.title} ${item.summary || ''}`);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            title: item.title,
            categories: analyzed.categories,
            tags: analyzed.tags,
            risk,
            heatScore: item.heatScore,
            platform: item.platform,
            url: item.url,
          }, null, 2),
        }],
      };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify({ topic, found: false }) }] };
  },
);

server.tool(
  'search_world',
  '搜索热点世界状态（非普通网页搜索，搜索 WebHot 维护的实时世界状态）',
  {
    query: z.string().describe('搜索关键词'),
    category: z.string().optional().describe('分类过滤'),
  },
  async ({ query, category }) => {
    const result = core.searchHot(query, 20);
    let items = result.items;
    if (category) {
      items = result.items.filter(i => i.categories?.includes(category));
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify({ results: items, total: items.length, query }, null, 2) }] };
  },
);

server.tool(
  'get_finance_signals',
  '获取金融相关热点信号：存储涨价、GPU缺货、HBM、AI Infra、数据中心等',
  {
    limit: z.number().optional().describe('返回数量，默认 10'),
  },
  async ({ limit }) => {
    const signals = core.getFinanceSignals(limit);
    return { content: [{ type: 'text' as const, text: JSON.stringify({ signals }, null, 2) }] };
  },
);

server.tool(
  'get_ai_trending',
  '获取 AI 生态趋势信号：Agent、MCP、AI Coding、Claude、OpenAI、Cursor 等',
  {
    limit: z.number().optional().describe('返回数量，默认 10'),
  },
  async ({ limit }) => {
    const signals = core.getAISignals(limit);
    return { content: [{ type: 'text' as const, text: JSON.stringify({ trends: signals }, null, 2) }] };
  },
);

server.tool(
  'get_topic_relationships',
  '分析热点之间的关联关系，如 HBM ↔ GPU ↔ AI Infra ↔ Datacenter',
  {
    topic: z.string().describe('话题关键词'),
  },
  async ({ topic }) => {
    const result = core.searchHot(topic, 10);
    const tags = new Set<string>();
    const relatedTopics: string[] = [];
    for (const item of result.items) {
      item.tags?.forEach(t => tags.add(t));
      if (item.title !== topic) relatedTopics.push(item.title);
    }
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ topic, relatedTopics, sharedTags: Array.from(tags) }, null, 2),
      }],
    };
  },
);

server.tool(
  'get_topic_cluster',
  '获取某个话题的聚类信息：同一事件在不同平台的呈现、跨平台扩散情况',
  {
    topic_id: z.string().describe('话题 ID'),
  },
  async ({ topic_id }) => {
    const cluster = core.topicRepo.findById(topic_id);
    if (!cluster) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ found: false, topic_id }) }] };
    }
    const items = cluster.hotItems.map(id => core.hotItemRepo.findById(id)).filter(Boolean);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          cluster,
          items,
          platformBreakdown: cluster.platforms,
          crossPlatform: cluster.platforms.length >= 2,
        }, null, 2),
      }],
    };
  },
);

server.tool(
  'map_to_a_share',
  '将热点话题映射到 A 股相关公司和产业链',
  {
    topic: z.string().describe('话题关键词，如 HBM / GPU / 存储涨价'),
  },
  async ({ topic }) => {
    const stocks = core.semantic.mapToAShare(topic, '');
    const searchResult = core.searchHot(topic, 5);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          topic,
          mappedStocks: stocks,
          relatedHotItems: searchResult.items.map(i => ({ title: i.title, platform: i.platform, heatScore: i.heatScore })),
        }, null, 2),
      }],
    };
  },
);

server.tool(
  'get_exploding_topics',
  '获取正在爆发的话题（增长最快的 Topic）',
  {
    limit: z.number().optional().describe('返回数量，默认 10'),
    min_growth: z.number().optional().describe('最低增长分数阈值，默认 5'),
  },
  async ({ limit, min_growth }) => {
    const topics = core.topicRepo.findExploding(min_growth || 5);
    const result = topics.slice(0, limit || 10);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ exploding: result, total: result.length }, null, 2),
      }],
    };
  },
);

// --- 启动 ---

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[webhot-mcp] server started via stdio');
