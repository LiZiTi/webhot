# WebHot MCP 热点情报统一服务架构设计文档

## 1. 项目定位

WebHot MCP 是一个专门服务于 AI 智能体自动化系统的「统一热点情报网关」。

它的目标不是做单纯的新闻聚合器，而是构建：

```text
多平台热点采集
→ 数据标准化
→ 热点分类
→ 热度分析
→ 趋势聚类
→ 金融/产业链语义映射
→ MCP 工具化输出
→ 服务 AI Agent 自动化
```

WebHot MCP 的最终形态是：

- 智能体时代的热点数据基础设施
- AI Agent 的实时外部世界感知层
- AI 自动化系统的热点输入网关
- 多平台趋势与事件统一语义层

---

# 2. 系统核心目标

## 2.1 核心设计目标

### 目标一：统一热点世界模型

将：

- NewsNow
- TopHub
- SoPilot
- 微博
- 知乎
- GitHub Trending
- Hacker News
- Reddit
- Twitter/X
- B站
- V2EX
- 抖音
- Telegram
- RSS
- 财经新闻
- 交易所公告
- AI 社区
- 开源社区

统一抽象为：

```text
Hot Topic
热点主题对象
```

而不是离散网站。

---

## 2.2 AI Agent First

WebHot 的核心服务对象：

不是人。

而是：

```text
AI Agent
LLM Workflow
LangGraph
AutoGPT
Claude MCP
Cursor Agent
ChatGPT Tool Calling
```

因此系统必须：

- 高结构化
- 高语义化
- 可推理
- 可聚类
- 可追踪
- 可扩展
- MCP 原生支持

---

## 2.3 面向自动化

WebHot 必须天然支持：

```text
定时轮询
主动推送
Agent 自主检索
自动主题发现
自动事件归因
自动行业映射
自动摘要
自动风险识别
```

而不是仅仅提供搜索接口。

---

# 3. 系统总体架构

```text
                ┌────────────────────┐
                │ 外部热点来源层      │
                └────────────────────┘

 NewsNow   TopHub   SoPilot   RSS   API   HTML   Browser

                ↓

        ┌────────────────────┐
        │ Source Adapter 层  │
        └────────────────────┘

                ↓

        ┌────────────────────┐
        │ Normalize 标准化层 │
        └────────────────────┘

                ↓

        ┌────────────────────┐
        │ Storage 数据层     │
        └────────────────────┘

                ↓

        ┌────────────────────┐
        │ Topic Cluster 层   │
        └────────────────────┘

                ↓

        ┌────────────────────┐
        │ Rank Engine 层     │
        └────────────────────┘

                ↓

        ┌────────────────────┐
        │ Semantic Engine    │
        └────────────────────┘

                ↓

        ┌────────────────────┐
        │ WebHot Core API    │
        └────────────────────┘

                ↓

        ┌────────────────────┐
        │ WebHot MCP Server  │
        └────────────────────┘

                ↓

        ┌────────────────────┐
        │ AI Agent 生态      │
        └────────────────────┘
```

---

# 4. 技术栈设计

## 4.1 核心语言

推荐：

```text
TypeScript
```

原因：

- MCP SDK 官方生态成熟
- Node.js 网络生态完整
- Playwright 支持强
- 适合 Agent Tool 化
- 更适合 IO 密集型系统

---

## 4.2 后端框架

推荐：

```text
Fastify
```

原因：

- 高性能
- 插件生态成熟
- TypeScript 友好
- 更适合 API Gateway

备选：

- Hono
- NestJS

---

## 4.3 数据库

MVP 阶段：

```text
SQLite
```

生产阶段：

```text
PostgreSQL
```

原因：

- JSONB 支持优秀
- 全文检索强
- 适合热点聚类
- 可扩展向量搜索

---

## 4.4 缓存层

推荐：

```text
Redis
```

用于：

- 热点缓存
- Topic Cache
- 热度排行榜
- 去重缓存
- Rate Limit
- Agent Session

---

## 4.5 浏览器自动化

推荐：

```text
Playwright
```

用于：

- 动态页面抓取
- Cloudflare 绕过
- JS 渲染站点
- 登录态页面

---

## 4.6 队列系统

推荐：

```text
BullMQ
```

用于：

- 热点采集任务
- 定时轮询
- 失败重试
- Agent 异步分析
- 推送队列

---

## 4.7 部署

推荐：

```text
Docker Compose
```

生产升级：

```text
Kubernetes
```

---

# 5. Monorepo 目录结构

```text
webhot/

  apps/
    api/
    mcp/
    worker/
    admin/

  packages/
    core/
    adapters/
    ranking/
    semantic/
    storage/
    schemas/
    sdk/

  infra/
    docker/
    nginx/
    monitoring/

  configs/
    sources.yaml
    categories.yaml

  scripts/

  docs/

  docker-compose.yml
```

---

# 6. Adapter 插件系统设计

## 6.1 核心理念

WebHot 必须支持：

```text
新增数据源 ≈ 新增插件
```

而不是修改核心代码。

---

## 6.2 Adapter 标准接口

```ts
interface HotSourceAdapter {
  id: string
  name: string
  type: 'api' | 'rss' | 'html' | 'browser'

  fetchList(params: FetchParams): Promise<RawHotItem[]>

  normalize(raw: RawHotItem): HotItem

  healthcheck(): Promise<boolean>
}
```

---

## 6.3 Adapter 分类

### API Adapter

适合：

- TopHub
- NewsNow API
- 官方开放接口

---

### RSS Adapter

适合：

- SoPilot RSS
- Hacker News RSS
- Reddit RSS

---

### HTML Adapter

适合：

- 静态页面热榜
- 简单 DOM 提取

---

### Browser Adapter

适合：

- Cloudflare
- JS 渲染
- 动态站点
- 登录态页面

---

# 7. 热点分类系统设计

WebHot 必须对热点进行明确分类。

这是整个系统的核心。

---

## 7.1 一级分类

```text
AI
Finance
Technology
Crypto
Business
Politics
Macro
Entertainment
Gaming
Sports
Science
Developer
Startup
Consumer
Automotive
Military
Energy
Healthcare
Education
Social
```

---

## 7.2 二级分类

### AI

```text
LLM
Open Source AI
AI Infra
AI Agent
AI Chip
AI Robotics
AI Video
AI Coding
AI Search
AI Startup
```

---

### Finance

```text
A-Share
US Stock
HK Stock
Macro Economy
ETF
Semiconductor
Storage Chip
AI Industry Chain
Broker
Quant
High Frequency
Policy
```

---

### Technology

```text
Cloud
Datacenter
GPU
CPU
Database
Frontend
Backend
CyberSecurity
MCP
Automation
Open Source
```

---

# 8. 热点标准数据模型

## 8.1 HotItem

```ts
interface HotItem {
  id: string

  source: string
  platform: string

  title: string
  summary?: string

  url: string

  author?: string

  rank?: number

  heatScore?: number

  trendScore?: number

  financeScore?: number

  aiScore?: number

  categories?: string[]

  tags?: string[]

  metrics?: {
    views?: number
    likes?: number
    comments?: number
    shares?: number
    stars?: number
  }

  publishedAt?: string

  collectedAt: string

  language?: string

  region?: string

  raw?: unknown
}
```

---

# 9. Topic 聚类系统

## 9.1 为什么需要 Topic Cluster

同一个事件：

```text
OpenAI 发布新模型
```

可能同时出现在：

- Twitter/X
- Hacker News
- Reddit
- GitHub
- 微博
- 知乎
- NewsNow

系统必须识别：

```text
这些是同一个主题
```

而不是独立热点。

---

## 9.2 Topic 对象

```ts
interface TopicCluster {
  id: string

  title: string

  aliases: string[]

  category: string

  hotItems: string[]

  trendScore: number

  growthScore: number

  platforms: string[]

  relatedStocks?: string[]

  createdAt: string
}
```

---

# 10. 热度评分系统

## 10.1 热度维度

WebHot 不应只使用单一热度。

而应构建：

```text
综合热度模型
```

---

## 10.2 评分维度

### 平台权重

```text
Twitter
GitHub
微博
知乎
Reddit
```

不同平台权重不同。

---

### 增速权重

重点不是：

```text
谁最大
```

而是：

```text
谁增长最快
```

---

### 金融相关性

例如：

```text
存储涨价
GPU短缺
HBM
英伟达
```

金融相关性应提升。

---

### AI 相关性

例如：

```text
MCP
Agent
Claude
OpenAI
Cursor
DeepSeek
```

AI 权重提升。

---

# 11. 语义分析层

## 11.1 Semantic Engine

核心目标：

```text
热点 → 事件 → 行业 → 股票 → 风险
```

---

## 11.2 能力

### 自动分类

```text
自动识别：
AI / Finance / Politics / Macro
```

---

### 自动打标签

```text
HBM
AI Infra
GPU
Agent
MCP
```

---

### A股映射

例如：

```text
HBM涨价
→ 存储芯片
→ A股相关公司
```

---

### 风险识别

例如：

```text
纯概念炒作
高位爆拉
消息真实性低
```

---

# 12. MCP Server 设计

## 12.1 MCP 核心目标

WebHot MCP 的目标：

```text
让 AI Agent 能像调用 Tavily 一样调用热点世界
```

---

## 12.2 MCP Tool 设计

### webhot.get_hot_list

```text
获取热点列表
```

参数：

```json
{
  "category": "AI",
  "platform": "twitter",
  "limit": 20
}
```

---

### webhot.search_hot

```text
搜索热点
```

---

### webhot.get_trending_topics

```text
获取升温最快主题
```

---

### webhot.get_topic_cluster

```text
获取主题聚类
```

---

### webhot.get_finance_related_hot

```text
获取财经相关热点
```

---

### webhot.map_to_a_share

```text
热点映射A股
```

---

### webhot.explain_hot_event

```text
解释热点重要性
```

---

# 13. Agent 工作流设计

## 13.1 主动轮询 Agent

```text
每5分钟
→ 拉取热点
→ 聚类
→ 评分
→ 判断增速
→ 推送高价值主题
```

---

## 13.2 A股情报 Agent

```text
热点事件
→ 产业链映射
→ 财务筛选
→ 风险过滤
→ 输出观察列表
```

---

## 13.3 AI 趋势 Agent

```text
Twitter/X
GitHub Trending
Hacker News
→ 发现新AI工具
→ MCP趋势
→ Agent生态变化
```

---

# 14. 推送系统设计

## 14.1 支持渠道

```text
Telegram
Discord
Slack
飞书
企业微信
邮件
Webhook
```

---

## 14.2 推送类型

### 高频推送

```text
重大事件
爆发式增长主题
```

---

### Digest 摘要

```text
每日AI热点
每日金融热点
每日A股情报
```

---

# 15. 配置化系统

## 15.1 sources.yaml

```yaml
sources:
  - id: newsnow_weibo
    adapter: newsnow
    platform: weibo
    endpoint: https://example.com/api/s?id=weibo
    interval: 300

  - id: sopilot_x
    adapter: rss
    endpoint: https://sopilot.net/rss/hottweets
    interval: 600
```

---

## 15.2 categories.yaml

```yaml
categories:
  AI:
    keywords:
      - llm
      - ai
      - agent
      - openai

  Finance:
    keywords:
      - stock
      - market
      - etf
      - semiconductor
```

---

# 16. 可扩展性设计

## 16.1 新平台接入

新增站点：

```text
只需要新增 Adapter
```

不修改核心系统。

---

## 16.2 新语义能力

未来支持：

```text
向量搜索
RAG
Agent Memory
Knowledge Graph
GraphRAG
```

---

## 16.3 多租户

未来支持：

```text
不同用户不同热点偏好
不同Agent不同订阅源
```

---

# 17. 安全与风控

## 17.1 限流

必须支持：

```text
IP Rate Limit
Token Rate Limit
Agent Quota
```

---

## 17.2 数据源熔断

如果：

```text
某站点失败
```

系统自动：

```text
降级
重试
切换备用源
```

---

## 17.3 反爬策略

支持：

```text
代理池
浏览器池
UserAgent轮换
Cookie池
```

---

# 18. 监控系统

## 18.1 指标

```text
采集成功率
热点增长速度
Topic数量
API响应时间
MCP调用量
```

---

## 18.2 推荐组件

```text
Prometheus
Grafana
Loki
```

---

# 19. MVP 路线图

## Phase 1

```text
NewsNow
TopHub
SoPilot RSS
统一API
MCP工具
```

---

## Phase 2

```text
Topic聚类
热度评分
AI分类
金融分类
```

---

## Phase 3

```text
A股映射
产业链识别
主动推送
多Agent协作
```

---

## Phase 4

```text
GraphRAG
向量数据库
热点知识图谱
自动投资研究Agent
```

---

# 20. 最终目标

WebHot MCP 的最终目标不是：

```text
热榜聚合器
```

而是：

```text
AI Agent 世界模型中的实时热点感知基础设施
```

未来任何：

- AI Agent
- 自动研究系统
- 金融分析 Agent
- AI 新闻系统
- 自动化工作流
- 趋势分析系统

都可以通过：

```text
WebHot MCP
```

获得：

```text
实时热点世界状态
```

最终形成：

```text
热点 → 事件 → 语义 → 行业 → 决策
```

的完整自动化链路。

