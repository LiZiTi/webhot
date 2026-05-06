# WebHot

**AI Agent 的实时世界状态系统** — 持续观察互联网世界，构建 World State、Timeline 和 Signal，通过 MCP / CLI / Webhook 服务 AI Agent 自动化。

---

## 定位

WebHot 不是新闻聚合器，也不是热榜 API。它是：

```
持续观察世界 → 记录变化 → 构建 Timeline → 维护 World State → 生成 Signal → 服务 Agent
```

- **MCP** → Agent 主动查询世界 (Pull)
- **CLI** → 脚本/CI 自动化调用 (Pull)
- **Webhook** → 世界变化主动通知 Agent (Push)

---

## 架构

```
                 外部世界
                    ↓
           Source Adapters   ← 11 个数据源
                    ↓
          Perception Engine  ← Snapshot + Diff
                    ↓
         Change Database     ← SQLite
                    ↓
   ┌────────┼────────┬────────┐
   ↓        ↓        ↓        ↓
Timeline  Ranking  Semantic  Signal
   ↓        ↓        ↓        ↓
          Core Orchestrator
                    ↓
   ┌────────┼────────┬────────┐
   ↓        ↓        ↓        ↓
  MCP      CLI    Webhook    API
```

### 目录结构

```
webhot/
├── apps/
│   ├── api/              Fastify API Server
│   ├── mcp/              MCP Server (stdio)
│   ├── cli/              命令行工具
│   ├── worker/           后台采集 Worker (BullMQ)
│   ├── webhook-worker/   Webhook 事件分发
│   └── admin/            管理后台 (占位)
├── packages/
│   ├── schemas/          共享类型定义
│   ├── storage/          SQLite3 数据层
│   ├── adapters/         11 个数据源适配器
│   ├── perception/       感知引擎 (Snapshot + Diff)
│   ├── ranking/          多维度热度评分
│   ├── timeline/         时间线引擎
│   ├── semantic/         语义分析引擎
│   ├── signal/           信号引擎
│   ├── core/             核心编排层
│   └── sdk/              客户端 SDK (占位)
├── configs/
│   ├── sources.yaml      数据源配置
│   ├── categories.yaml   分类关键词
│   └── webhooks.yaml     Webhook 订阅
├── docs/                 规格文档
├── scripts/              工具脚本
├── infra/                基础设施
└── docker-compose.yml
```

---

## 快速开始

### 环境要求

- **Node.js** >= 22
- **pnpm** >= 9 (`npm install -g pnpm`)
- **Redis** >= 7 (BullMQ 队列依赖)

### 安装与启动

```bash
# 1. 克隆并安装依赖
git clone <repo-url> webhot
cd webhot
pnpm install

# 2. 启动 Redis
redis-server                        # 或: docker run -d -p 6379:6379 redis:7-alpine

# 3. 全部启动
pnpm dev

# 或分开启动
pnpm dev:api        # API Server → http://localhost:3000
pnpm dev:mcp        # MCP Server → stdio
pnpm dev:worker     # Worker → 定时采集
pnpm dev:webhook    # Webhook → 30s 分发
```

### Docker 部署

```bash
docker compose up -d
```

启动后：
- API: `http://localhost:3000`
- Redis: `localhost:6379`

---

## 使用方式

### CLI

```bash
# 当前世界状态
pnpm webhot state

# 热点趋势
pnpm webhot trending -c AI

# 话题时间线
pnpm webhot timeline "MCP"

# AI 趋势信号
pnpm webhot ai

# 金融热点信号
pnpm webhot finance

# 所有信号
pnpm webhot signals -c explosion

# JSON 输出 (适合脚本消费)
pnpm webhot trending --json

# Markdown 输出 (适合日报)
pnpm webhot ai --markdown
```

### MCP (AI Agent 工具调用)

在 Claude / Cursor / 其他 MCP Client 中配置：

```json
{
  "mcpServers": {
    "webhot": {
      "command": "node",
      "args": ["path/to/apps/mcp/dist/index.js"]
    }
  }
}
```

可用工具：

| 工具 | 说明 |
|------|------|
| `get_hot_list` | 获取热点列表 (按分类/平台过滤) |
| `search_hot` | 搜索热点 |
| `get_trending_topics` | 获取升温最快的主题 |
| `get_world_state` | 获取当前世界状态 |
| `get_topic_timeline` | 获取话题时间线 |
| `explain_topic` | 解释热点重要性 |
| `search_world` | 搜索世界状态 |
| `get_finance_signals` | 金融信号 |
| `get_ai_trending` | AI 趋势信号 |
| `get_topic_relationships` | 话题关联分析 |
| `get_topic_cluster` | 话题聚类详情 |
| `map_to_a_share` | 热点 → A 股映射 |
| `get_exploding_topics` | 正在爆发的 Topic |

### API

```
GET  /health
GET  /api/v1/hot?category=AI&platform=github&limit=20
GET  /api/v1/hot/search?q=MCP
GET  /api/v1/hot/trending?category=Finance
GET  /api/v1/topics
GET  /api/v1/topics/exploding
GET  /api/v1/topics/:id/cluster
GET  /api/v1/timeline/:topicId
GET  /api/v1/signals
GET  /api/v1/signals/:type       (ai/finance/explosion/risk/cross_platform)
GET  /api/v1/world
GET  /api/v1/map/a-share?topic=HBM
POST /api/v1/ingest              { items: HotItem[] }
```

---

## 数据源

| 适配器 | 平台 | 类型 |
|--------|------|------|
| NewsNow | 微博/知乎 | api |
| TopHub | 热榜聚合 | html |
| SoPilot | 社交媒体 | rss |
| GitHub Trending | 开源趋势 | api |
| Hacker News | 技术社区 | api |
| Reddit | programming/technology/artificial | api |
| Twitter/X | 社交网络 | api (Nitter) |
| 财经新闻 | 财联社/东方财富 | api/html |

新增数据源：编辑 `configs/sources.yaml` + 实现 `HotSourceAdapter` 接口即可。

---

## 配置文件

### sources.yaml

```yaml
sources:
  - id: hackernews
    adapter: hackernews
    interval: 300       # 轮询间隔 (秒)
```

### categories.yaml

```yaml
categories:
  AI:
    keywords: [llm, ai, agent, openai, claude, mcp]
  Finance:
    keywords: [stock, 股票, hbm, gpu, 半导体]
```

### webhooks.yaml

```yaml
webhooks:
  - id: my_agent
    url: http://localhost:4000/webhook/webhot
    secret: my-secret
    events: [topic.exploding, signal.ai, signal.finance]
    retryMax: 3
    timeoutMs: 10000
```

---

## 核心引擎

### Perception Engine
采集 HotItem → 生成 Snapshot → 对比历史 → 检测变化 (Diff: 新热点 / 热度飙升)

### Ranking Engine
6 维评分：平台权重 + 金融相关性 + AI 相关性 + 互动量 + 原始热度 + 趋势/增速

### Timeline Engine
记录事件演化轨迹：首次出现 → 排名变化 → 跨平台扩散 → 爆发时刻

### Semantic Engine
自动分类 (20 大类) + 标签提取 + A 股映射 + 风险识别

### Signal Engine
5 类信号：explosion / cross_platform / finance / ai / risk

### Lightweight Cluster Engine
基于中文 bigram/trigram + Jaccard 相似度的 Topic 聚类 (零外部依赖)

---

## 技术栈

| 层 | 技术 |
|----|------|
| 语言 | TypeScript (ESM) |
| 包管理 | pnpm monorepo |
| API | Fastify |
| MCP | @modelcontextprotocol/sdk |
| CLI | Commander.js |
| 数据库 | SQLite3 (better-sqlite3) MVP / PostgreSQL 生产 |
| 缓存 | Redis (ioredis) |
| 队列 | BullMQ |
| 部署 | Docker Compose |
| 浏览器 | Playwright (Phase 2) |

---

## 运行脚本

```bash
pnpm dev              # 启动全部服务
pnpm dev:api          # API Server
pnpm dev:mcp          # MCP Server
pnpm dev:worker       # 采集 Worker
pnpm dev:webhook      # Webhook Worker
pnpm build            # 编译所有包
pnpm typecheck        # 类型检查
pnpm clean            # 清理构建产物
pnpm setup            # 完整安装 + 编译
```

辅助脚本见 `scripts/` 目录。

---

## 路线图

- [x] Phase 1: 数据源适配器 + API + MCP + CLI + Webhook
- [x] Phase 2: Topic 聚类 + 热度评分 + 语义分析 + Timeline
- [x] Phase 3: Signal 引擎 + Webhook 分发 + BullMQ 队列
- [ ] Phase 4: Browser Adapter (Playwright) + 推送渠道 (Telegram)
- [ ] Phase 5: PostgreSQL + Grafana + 二级分类 + SDK

---

## 文档

| 文档 | 说明 |
|------|------|
| [架构设计规格](docs/webhot_mcp_architecture_specification_v_1.md) | 整体架构 + 数据模型 + MCP 设计 |
| [感知引擎规格](docs/webhot_perception_engine_technical_specification.md) | Perception / Diff / Topic 聚类 |
| [Agent 自动化规格](docs/webhot_agent_automation_integration_specification.md) | Agent 接入 + Timeline + CLI |
| [世界状态与 Timeline](docs/webhot_world_state_and_timeline_core_strategy.md) | World State + Change Database |
| [MCP/CLI/Webhook 规格](docs/webhot_mcp_cli_webhook_integration_specification.md) | 三者边界 + Push/Pull 模型 |

---

## License

MIT
