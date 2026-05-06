import Fastify from 'fastify';
import cors from '@fastify/cors';
import { WebHotCore } from '@webhot/core';

const core = new WebHotCore();
const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

// 健康检查
app.get('/health', async () => ({ status: 'ok', service: 'webhot-api' }));

// --- 热点查询 API ---

// GET /api/v1/hot — 获取热点列表
app.get('/api/v1/hot', async (req) => {
  const { category, platform, limit } = req.query as Record<string, string>;
  return core.getHotList({ category, platform, limit: limit ? Number(limit) : 30 });
});

// GET /api/v1/hot/search — 搜索热点
app.get('/api/v1/hot/search', async (req) => {
  const { q, limit } = req.query as Record<string, string>;
  return core.searchHot(q || '', limit ? Number(limit) : 20);
});

// GET /api/v1/hot/trending — 获取升温最快的主题
app.get('/api/v1/hot/trending', async (req) => {
  const { category, limit } = req.query as Record<string, string>;
  return { topics: core.getTrendingTopics(category, limit ? Number(limit) : 10) };
});

// --- Timeline API ---

// GET /api/v1/timeline/:topicId — 获取话题时间线
app.get('/api/v1/timeline/:topicId', async (req) => {
  const { topicId } = req.params as Record<string, string>;
  return core.getTopicTimeline(topicId);
});

// --- Signal API ---

// GET /api/v1/signals/finance — 金融信号
app.get('/api/v1/signals/finance', async (req) => {
  const { limit } = req.query as Record<string, string>;
  return { signals: core.getFinanceSignals(limit ? Number(limit) : 10) };
});

// GET /api/v1/signals/ai — AI 信号
app.get('/api/v1/signals/ai', async (req) => {
  const { limit } = req.query as Record<string, string>;
  return { signals: core.getAISignals(limit ? Number(limit) : 10) };
});

// GET /api/v1/signals — 全部信号
app.get('/api/v1/signals', async () => {
  return { signals: core.signal.getRecentSignals(30) };
});

// --- World State API ---

// GET /api/v1/world — 获取当前世界状态
app.get('/api/v1/world', async () => {
  return core.getWorldState();
});

// POST /api/v1/ingest — 采集新热点（Worker 调用）
app.post('/api/v1/ingest', async (req) => {
  const body = req.body as { items?: unknown[] };
  if (!body?.items || !Array.isArray(body.items)) {
    return { status: 'error', message: 'invalid body: { items: HotItem[] }' };
  }
  const result = core.ingest(body.items as any[]);
  return { status: 'ok', ingested: result.length };
});

// --- Topic Cluster API ---

// GET /api/v1/topics — 获取所有 Topic 列表
app.get('/api/v1/topics', async (req) => {
  const { category, limit } = req.query as Record<string, string>;
  if (category) {
    return { topics: core.topicRepo.findByCategory(category, limit ? Number(limit) : 30) };
  }
  return { topics: core.topicRepo.findTrending(limit ? Number(limit) : 30) };
});

// GET /api/v1/topics/exploding — 获取正在爆发的 Topic
app.get('/api/v1/topics/exploding', async (req) => {
  const { limit, min_growth } = req.query as Record<string, string>;
  const topics = core.topicRepo.findExploding(min_growth ? Number(min_growth) : 5);
  return { exploding: topics.slice(0, limit ? Number(limit) : 10) };
});

// GET /api/v1/topics/:id/cluster — 获取 Topic 聚类详情
app.get('/api/v1/topics/:id/cluster', async (req) => {
  const { id } = req.params as Record<string, string>;
  const cluster = core.topicRepo.findById(id);
  if (!cluster) return { status: 'error', message: 'topic not found' };
  const items = cluster.hotItems.map(hid => core.hotItemRepo.findById(hid)).filter(Boolean);
  return { cluster, items, crossPlatform: cluster.platforms.length >= 2 };
});

// --- A-Share Mapping API ---

// GET /api/v1/map/a-share — 热点 A 股映射
app.get('/api/v1/map/a-share', async (req) => {
  const { topic } = req.query as Record<string, string>;
  if (!topic) return { status: 'error', message: 'query param "topic" required' };
  const stocks = core.semantic.mapToAShare(topic, '');
  const searchResult = core.searchHot(topic, 5);
  return {
    topic,
    mappedStocks: stocks,
    relatedHotItems: searchResult.items.map(i => ({
      title: i.title, platform: i.platform, heatScore: i.heatScore,
    })),
  };
});

// --- Signals by category ---

// GET /api/v1/signals/:type — 按类型获取信号
app.get('/api/v1/signals/:type', async (req) => {
  const { type } = req.params as Record<string, string>;
  const { limit } = req.query as Record<string, string>;
  const validTypes = ['explosion', 'cross_platform', 'finance', 'ai', 'risk'];
  if (!validTypes.includes(type)) {
    return { status: 'error', message: `invalid signal type: ${type}. valid: ${validTypes.join(', ')}` };
  }
  return { signals: core.signal.getSignalsByType(type as any, limit ? Number(limit) : 20) };
});

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

try {
  await app.listen({ port, host });
  console.log(`[webhot-api] running on http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
