# WebHot × AI Agent 自动化集成技术规格方案

版本：v1.0

项目名称：WebHot

文档类型：AI Agent 自动化接入规格说明书

核心目标：

```text
为 AI 智能体提供实时、精准、结构化、可追踪的在线热点世界能力
```

重点能力：

- 实时热点感知
- 热点事件时间线
- 跨平台事件聚类
- MCP Tool Calling
- CLI 自动化调用
- AI Agent 主动观察
- 长期世界状态维护
- 热点事件推理
- 金融/AI/科技热点自动分析

---

# 1. 项目定位

WebHot 的定位不是：

```text
新闻 API
```

而是：

```text
AI Agent 的实时热点世界基础设施
```

未来的 AI Agent：

- 不应只依赖静态训练数据
- 不应只依赖传统搜索引擎
- 不应只依赖单次网页抓取

而必须具备：

```text
持续在线观察世界
```

的能力。

WebHot 的目标就是：

```text
把“世界正在发生什么”实时提供给智能体
```

---

# 2. 核心问题

当前 AI Agent 的最大问题之一：

```text
缺乏长期、连续、结构化的世界感知能力
```

例如：

Agent 很难知道：

- 哪个 AI 工具正在爆发
- 哪个热点正在跨平台扩散
- 哪个金融事件正在持续升温
- 哪个开源项目正在形成趋势
- 某个热点过去 24 小时是如何演化的
- 某个主题最早是谁引爆的
- 某个事件在哪个平台先出现

传统搜索：

```text
只能解决“查”
```

无法解决：

```text
持续感知
时间演化
趋势变化
事件链路
```

因此：

WebHot 的目标是：

```text
让 AI Agent 拥有实时热点世界模型
```

---

# 3. 系统核心能力

## 3.1 实时热点感知

系统持续：

```text
观察互联网世界
```

包括：

- NewsNow
- TopHub
- SoPilot
- Twitter/X
- Reddit
- GitHub Trending
- Hacker News
- 微博
- 知乎
- V2EX
- B站
- RSS
- 财经新闻
- AI 社区
- MCP 生态

系统主动：

- 轮询
- 聚类
- 对比历史
- 判断变化
- 更新状态
- 生成信号

最终形成：

```text
实时热点世界状态
```

---

## 3.2 热点时间线能力

WebHot 的核心差异化能力之一：

```text
Timeline（时间线）
```

AI Agent 不仅要知道：

```text
什么火了
```

还必须知道：

```text
它是怎么火起来的
```

因此：

WebHot 必须维护：

```text
事件时间线
```

例如：

```text
HBM 涨价事件
```

Timeline：

```text
08:00 Twitter/X 首次出现
09:10 Reddit 开始讨论
10:20 微博热度增长
11:30 财经媒体报道
13:00 GitHub AI Infra 项目提及
14:00 A股半导体板块异动
```

这种时间演化能力：

是传统搜索无法提供的。

---

# 4. AI Agent 接入目标

WebHot 必须：

```text
Agent First
```

优先服务：

- Claude Agent
- Cursor Agent
- ChatGPT Tool Calling
- LangGraph
- AutoGen
- OpenManus
- OpenHands
- AutoGPT
- 自定义智能体

系统设计目标：

```text
让 Agent 能像调用记忆一样调用世界热点
```

---

# 5. MCP 集成方案

## 5.1 为什么优先 MCP

MCP 的优势：

```text
天然适合 Agent Tool Calling
```

AI Agent 可以：

- 主动调用热点工具
- 获取结构化结果
- 自动检索时间线
- 自动查询世界状态
- 自动推理热点演化

因此：

WebHot 必须原生支持：

```text
MCP Server
```

---

## 5.2 MCP 系统架构

```text
AI Agent
     ↓
MCP Client
     ↓
WebHot MCP Server
     ↓
WebHot Core API
     ↓
Perception Engine
     ↓
World State
```

---

# 6. MCP Tool 设计

## 6.1 get_world_state

作用：

```text
获取当前世界热点状态
```

返回：

- 当前热点
- 正在爆发的话题
- AI 热点
- 金融热点
- 风险事件

示例：

```json
{
  "trending": [...],
  "exploding": [...],
  "finance": [...],
  "ai": [...]
}
```

---

## 6.2 get_hot_topics

作用：

```text
获取热点列表
```

支持：

- category
- platform
- region
- trend level

---

## 6.3 get_topic_timeline

核心工具。

作用：

```text
获取热点事件时间线
```

例如：

```text
HBM
DeepSeek
Claude Code
MCP
```

返回：

```json
{
  "topic": "HBM涨价",
  "timeline": [
    {
      "time": "2026-05-01T08:00:00Z",
      "platform": "twitter",
      "event": "首次出现供应短缺讨论"
    }
  ]
}
```

---

## 6.4 explain_topic

作用：

```text
解释热点事件的重要性
```

例如：

```text
为什么 MCP 最近突然爆发？
```

Agent 可自动调用。

---

## 6.5 search_world

作用：

```text
搜索热点世界状态
```

而不是普通网页搜索。

---

## 6.6 get_finance_signals

作用：

```text
获取金融相关热点信号
```

例如：

- 存储涨价
- GPU 缺货
- HBM
- AI Infra
- 数据中心

---

## 6.7 get_ai_trending

作用：

```text
获取 AI 生态趋势
```

包括：

- Agent
- MCP
- AI Coding
- Claude
- OpenAI
- Cursor
- LangGraph

---

## 6.8 get_topic_relationships

作用：

```text
分析热点之间的关联
```

例如：

```text
HBM ↔ GPU ↔ AI Infra ↔ Datacenter
```

---

# 7. CLI 自动化方案

## 7.1 为什么需要 CLI

很多 Agent：

并不一定直接支持 MCP。

因此：

WebHot 必须支持：

```text
CLI Mode
```

方便：

- Shell Agent
- Cursor Tasks
- Claude Code
- Cron Job
- GitHub Actions
- Linux Workflow
- Docker Agent

---

# 8. CLI 设计

## 8.1 CLI 示例

```bash
webhot trending
```

返回：

```text
当前热点趋势
```

---

## 8.2 Timeline 查询

```bash
webhot timeline "HBM"
```

返回：

```text
HBM 事件演化时间线
```

---

## 8.3 AI 热点

```bash
webhot ai
```

返回：

```text
AI 生态趋势
```

---

## 8.4 金融热点

```bash
webhot finance
```

返回：

```text
金融热点世界状态
```

---

## 8.5 JSON 输出

```bash
webhot trending --json
```

用于：

```text
Agent 自动处理
```

---

# 9. Timeline（时间线）系统设计

## 9.1 为什么 Timeline 是核心能力

大部分热点系统：

只能告诉 Agent：

```text
什么是热点
```

WebHot 必须告诉 Agent：

```text
热点是如何演化的
```

---

## 9.2 Timeline 数据结构

```ts
interface TopicTimeline {
  topicId: string

  title: string

  events: TimelineEvent[]
}

interface TimelineEvent {
  time: string

  platform: string

  source: string

  title: string

  url?: string

  summary?: string

  metrics?: {
    heat?: number
    views?: number
    likes?: number
  }
}
```

---

## 9.3 Timeline 生成逻辑

系统持续：

- 保存快照
- 聚类 Topic
- 记录事件
- 记录扩散路径
- 记录热度变化

最终形成：

```text
Topic Evolution Timeline
```

---

# 10. Agent 自动化工作流

## 10.1 主动观察 Agent

Agent 定时：

```text
调用 WebHot
```

例如：

```text
每10分钟
→ get_world_state
→ 判断新热点
→ 自动分析
→ 自动推送
```

---

## 10.2 AI Research Agent

```text
WebHot
→ AI 热点
→ Agent 自动分析
→ 输出研究报告
```

---

## 10.3 金融情报 Agent

```text
热点
→ Timeline
→ 金融相关性
→ A股映射
→ 风险分析
→ 推送观察名单
```

---

## 10.4 MCP 趋势 Agent

```text
MCP 热点
→ GitHub Trending
→ Twitter/X
→ Hacker News
→ Agent 世界趋势
```

---

# 11. 世界状态系统

## 11.1 World State

WebHot 必须维护：

```text
当前世界正在发生什么
```

---

## 11.2 状态分类

### AI World

```text
LLM
Agent
MCP
Open Source AI
AI Infra
```

---

### Finance World

```text
A股
美股
AI产业链
GPU
HBM
Datacenter
```

---

### Tech World

```text
Cloud
DevTools
Database
Frontend
Backend
```

---

# 12. 主动推送系统

## 12.1 为什么 Agent 需要主动通知

真正高级的 Agent：

不应该等用户提问。

而应该：

```text
主动发现重要变化
```

---

## 12.2 Push Signal

系统自动：

- 判断爆发
- 判断跨平台扩散
- 判断金融相关性
- 判断 AI 相关性

然后：

```text
主动推送给 Agent
```

---

# 13. WebHot 与传统搜索的区别

## 13.1 搜索引擎模式

```text
用户问
→ 搜索
→ 返回网页
```

---

## 13.2 WebHot 模式

```text
持续观察世界
→ 建立世界状态
→ 识别趋势
→ 构建时间线
→ Agent 主动推理
```

---

# 14. 技术架构

```text
                WebHot

      ┌────────────────────┐
      │ Source Adapter     │
      └────────────────────┘

                  ↓

      ┌────────────────────┐
      │ Perception Engine  │
      └────────────────────┘

                  ↓

      ┌────────────────────┐
      │ Timeline Engine    │
      └────────────────────┘

                  ↓

      ┌────────────────────┐
      │ Semantic Engine    │
      └────────────────────┘

                  ↓

      ┌────────────────────┐
      │ World State        │
      └────────────────────┘

                  ↓

      ┌────────────────────┐
      │ Core API           │
      └────────────────────┘

                  ↓

      ┌────────────────────┐
      │ MCP / CLI          │
      └────────────────────┘

                  ↓

      ┌────────────────────┐
      │ AI Agent           │
      └────────────────────┘
```

---

# 15. 推荐技术栈

## 15.1 Core

```text
TypeScript
Fastify
```

---

## 15.2 Queue

```text
BullMQ
Redis
```

---

## 15.3 Database

```text
PostgreSQL
```

---

## 15.4 Browser

```text
Playwright
```

---

## 15.5 MCP

```text
@modelcontextprotocol/sdk
```

---

## 15.6 CLI

```text
Commander.js
```

---

# 16. 最终目标

WebHot 的最终目标不是：

```text
新闻聚合器
```

而是：

```text
AI Agent 的实时热点世界系统
```

未来任何 Agent 都可以通过：

- MCP
- CLI
- API

接入 WebHot。

最终形成：

```text
世界变化
→ 热点感知
→ Timeline
→ 趋势分析
→ Agent 推理
→ 自动行动
```

的完整智能体自动化链路。

