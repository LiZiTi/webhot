# WebHot 感知引擎（Perception Engine）技术规格方案

版本：v1.0

项目代号：WebHot

文档类型：核心架构技术规格说明书

目标对象：

- AI Agent 开发者
- MCP 服务开发者
- 自动化系统架构师
- 热点情报系统开发者
- 多智能体系统设计者

---

# 1. 文档目标

本方案专注于 WebHot 系统中最核心的能力：

```text
Perception（感知）
```

WebHot 不只是：

- 热榜聚合器
- API 网关
- 新闻抓取器

而是：

```text
AI Agent 的外部世界实时感知系统
```

因此：

本技术规格书重点定义：

- 什么是“感知”
- WebHot 如何实现感知
- 感知系统的数据结构
- 感知系统的状态模型
- 热点变化检测机制
- 事件识别机制
- 趋势感知机制
- Topic 聚类机制
- 主动感知机制
- 被动感知机制
- Agent 感知触发机制
- 金融与 AI 热点感知机制

---

# 2. 感知系统核心定义

## 2.1 什么是感知

在 WebHot 中：

感知不是：

```text
抓取网页
```

感知真正的定义是：

```text
系统持续观察外部世界变化
并建立热点状态模型
识别重要事件
判断趋势变化
最终形成可供 AI 推理的世界状态
```

因此：

```text
感知 ≠ 爬虫
```

真正的感知链路：

```text
采集
→ 标准化
→ 历史对比
→ 去重
→ 聚类
→ 趋势分析
→ 事件识别
→ 热点评分
→ 重要性判断
→ 状态更新
→ Agent 通知
```

---

# 3. WebHot 感知系统总体架构

```text
                    外部世界

  NewsNow   TopHub   SoPilot   RSS   Twitter/X
  GitHub    Reddit   微博      知乎   财经新闻

                          ↓

              ┌────────────────────┐
              │ Source Poller 层   │
              └────────────────────┘

                          ↓

              ┌────────────────────┐
              │ Normalize 标准化层 │
              └────────────────────┘

                          ↓

              ┌────────────────────┐
              │ Snapshot 快照层    │
              └────────────────────┘

                          ↓

              ┌────────────────────┐
              │ Diff 变化检测层    │
              └────────────────────┘

                          ↓

              ┌────────────────────┐
              │ Topic Cluster 层   │
              └────────────────────┘

                          ↓

              ┌────────────────────┐
              │ Trend Engine 层    │
              └────────────────────┘

                          ↓

              ┌────────────────────┐
              │ Semantic Engine    │
              └────────────────────┘

                          ↓

              ┌────────────────────┐
              │ Signal Engine      │
              └────────────────────┘

                          ↓

              ┌────────────────────┐
              │ World State        │
              └────────────────────┘

                          ↓

              ┌────────────────────┐
              │ MCP / Agent        │
              └────────────────────┘
```

---

# 4. 感知系统核心原则

## 4.1 主动感知优先

WebHot 必须以：

```text
主动感知
```

为核心。

而不是：

```text
用户问了才搜索
```

系统应持续：

- 定时观察世界
- 判断变化
- 更新状态
- 识别风险
- 发现趋势
- 主动触发事件

因此：

WebHot 本质上是：

```text
长期运行的世界观察系统
```

---

## 4.2 状态优先

WebHot 的核心不是数据。

而是：

```text
状态（State）
```

例如：

系统必须知道：

```text
HBM 是否正在升温？
OpenAI 是否持续霸榜？
某 AI Agent 工具是否突然爆发？
某产业链是否跨平台扩散？
```

因此：

系统必须维护：

```text
世界状态（World State）
```

---

## 4.3 连续观察

热点的真正价值来自：

```text
变化
```

而不是单次快照。

系统必须具备：

```text
持续时间维度观察能力
```

例如：

```text
10分钟前热度：100
现在热度：800
增长率：700%
```

这才是真正的趋势感知。

---

# 5. 感知系统数据流

## 5.1 第一阶段：主动轮询

WebHot Worker 持续执行：

```text
定时任务
```

例如：

| 数据源 | 轮询频率 |
|---|---|
| Twitter/X | 1~3 分钟 |
| NewsNow | 5 分钟 |
| TopHub | 5~10 分钟 |
| GitHub Trending | 10 分钟 |
| 财经新闻 | 1 分钟 |
| RSS | 5 分钟 |

轮询系统：

```text
Poller Engine
```

负责：

- 调度
- 并发
- 重试
- 熔断
- 限流
- 缓存

---

# 6. Snapshot（世界快照）系统

## 6.1 为什么必须有 Snapshot

没有历史快照：

系统无法知道：

```text
热点是否在变化
```

因此：

WebHot 必须保存：

```text
时间序列快照
```

---

## 6.2 Snapshot 数据结构

```ts
interface HotSnapshot {
  id: string

  source: string

  platform: string

  topicId: string

  title: string

  heatScore: number

  trendScore?: number

  rank?: number

  collectedAt: string

  metrics?: {
    views?: number
    likes?: number
    comments?: number
    shares?: number
  }
}
```

---

# 7. Diff（变化检测）系统

## 7.1 感知的本质是 Diff

真正的感知来自：

```text
变化
```

系统必须持续比较：

```text
当前状态
vs
历史状态
```

---

## 7.2 Diff Engine 职责

### 新热点检测

```text
是否首次出现
```

---

### 热度增长检测

```text
增长速度是否异常
```

---

### 排名变化检测

```text
是否快速冲榜
```

---

### 跨平台扩散检测

```text
是否从单平台扩散到多平台
```

---

### 情绪变化检测

```text
讨论情绪是否突变
```

---

# 8. Topic Cluster（主题聚类）系统

## 8.1 为什么必须聚类

真实世界中的热点：

```text
不会只存在一个标题
```

例如：

```text
OpenAI 发布 GPT-6
```

可能同时出现：

```text
Twitter/X
微博
知乎
Reddit
GitHub
```

但标题不同。

因此：

必须识别：

```text
这是同一个世界事件
```

---

## 8.2 聚类维度

### 标题相似度

```text
Embedding Similarity
```

---

### 关键词交集

```text
实体识别
```

---

### URL 来源

```text
是否引用同一事件
```

---

### 时间窗口

```text
是否在同一时间爆发
```

---

### 语义主题

```text
是否属于同一主题空间
```

---

# 9. Trend Engine（趋势感知引擎）

## 9.1 为什么趋势比热度更重要

真正重要的：

不是：

```text
谁最大
```

而是：

```text
谁增长最快
```

---

## 9.2 趋势评分模型

TrendScore 应由以下组成：

| 维度 | 权重 |
|---|---|
| 热度增长率 | 高 |
| 排名提升 | 高 |
| 平台扩散 | 高 |
| 增量讨论量 | 高 |
| 持续时间 | 中 |
| 平台权重 | 中 |

---

## 9.3 爆发检测

系统应识别：

```text
突然爆发事件
```

例如：

```text
10分钟增长 1000%
```

则触发：

```text
Explosion Signal
```

---

# 10. Semantic Engine（语义感知引擎）

## 10.1 语义感知目标

WebHot 不只是知道：

```text
什么火了
```

而是知道：

```text
为什么火
会影响什么
属于哪个领域
是否重要
```

---

## 10.2 核心能力

### 自动分类

例如：

```text
AI
Finance
Politics
Macro
Crypto
Technology
```

---

### 实体识别

例如：

```text
OpenAI
NVIDIA
HBM
DeepSeek
Claude
```

---

### 金融相关性

例如：

```text
HBM
GPU
算力
存储涨价
```

自动识别为：

```text
A股高相关主题
```

---

### AI Agent 相关性

例如：

```text
MCP
Agent
Claude Code
Cursor
```

自动提升权重。

---

# 11. Signal（信号）系统

## 11.1 为什么需要 Signal

不是所有热点都值得通知 Agent。

因此：

系统必须产生：

```text
Signal（信号）
```

---

## 11.2 Signal 类型

### Explosion Signal

```text
热点爆发
```

---

### CrossPlatform Signal

```text
跨平台扩散
```

---

### Finance Signal

```text
金融相关热点
```

---

### AI Signal

```text
AI / MCP / Agent 相关热点
```

---

### Risk Signal

```text
高风险事件
```

---

# 12. World State（世界状态模型）

## 12.1 核心思想

WebHot 必须维护：

```text
世界当前正在发生什么
```

因此：

系统需要：

```text
World State
```

---

## 12.2 World State 数据结构

```ts
interface WorldState {
  activeTopics: TopicCluster[]

  trendingTopics: TopicCluster[]

  explodingTopics: TopicCluster[]

  financeTopics: TopicCluster[]

  aiTopics: TopicCluster[]

  riskTopics: TopicCluster[]

  lastUpdatedAt: string
}
```

---

# 13. Agent 感知接口

## 13.1 MCP 本质

MCP 不负责感知。

MCP 只是：

```text
把感知能力开放给 Agent
```

---

## 13.2 MCP Tool 示例

### get_world_state

```text
获取世界状态
```

---

### get_exploding_topics

```text
获取正在爆发的话题
```

---

### get_finance_signals

```text
获取金融相关信号
```

---

### get_ai_trending

```text
获取 AI 热点趋势
```

---

### explain_topic

```text
解释某个热点事件
```

---

# 14. 主动感知 vs 被动感知

## 14.1 主动感知

系统持续：

```text
观察世界
```

并主动：

- 更新状态
- 识别变化
- 推送事件
- 触发信号

这是 WebHot 的核心。

---

## 14.2 被动感知

用户或 Agent：

```text
按需查询
```

例如：

```text
今天 AI Agent 有什么热点？
```

---

## 14.3 正确模式

WebHot 必须：

```text
主动为主
被动为辅
```

否则：

它就只是搜索引擎。

---

# 15. AI 金融感知系统

## 15.1 金融感知目标

WebHot 必须能够：

```text
热点
→ 产业链
→ 行业
→ A股映射
```

---

## 15.2 示例

```text
HBM 涨价
→ 存储芯片
→ AI Infra
→ A股映射
```

---

## 15.3 金融感知重点

### 供需变化

```text
涨价
缺货
订单
扩产
```

---

### 政策变化

```text
补贴
监管
国产替代
```

---

### AI 基础设施

```text
GPU
HBM
Datacenter
液冷
电源
```

---

# 16. AI 趋势感知系统

## 16.1 AI 生态感知

系统持续观察：

```text
OpenAI
Claude
DeepSeek
MCP
Agent
Cursor
LangGraph
```

---

## 16.2 Agent 世界趋势

系统识别：

```text
哪些工具正在快速崛起
哪些协议正在扩散
哪些框架正在形成生态
```

---

# 17. 时间维度感知

## 17.1 短期感知

```text
分钟级变化
```

---

## 17.2 中期感知

```text
日级趋势
```

---

## 17.3 长期感知

```text
周/月级演化
```

---

# 18. 技术栈建议

## 18.1 Worker

推荐：

```text
Node.js + BullMQ
```

---

## 18.2 数据库

推荐：

```text
PostgreSQL
```

---

## 18.3 Cache

推荐：

```text
Redis
```

---

## 18.4 Browser

推荐：

```text
Playwright
```

---

## 18.5 Embedding

推荐：

```text
OpenAI Embedding
BGE
VoyageAI
```

---

# 19. MVP 路线图

## Phase 1

```text
主动轮询
Snapshot
Diff
热点列表
```

---

## Phase 2

```text
Topic 聚类
Trend Engine
Signal Engine
```

---

## Phase 3

```text
Semantic Engine
金融感知
AI感知
```

---

## Phase 4

```text
World State
GraphRAG
Knowledge Graph
```

---

# 20. 最终目标

WebHot 最终不是：

```text
热点 API
```

而是：

```text
AI Agent 的实时世界感知系统
```

它将持续：

- 观察世界
- 建立状态
- 识别趋势
- 判断变化
- 发现信号
- 主动通知 Agent

最终形成：

```text
世界变化
→ 热点事件
→ 语义理解
→ 趋势分析
→ Agent 决策
```

的完整自动化链路。

