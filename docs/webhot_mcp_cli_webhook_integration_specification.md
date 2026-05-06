# WebHot 中 MCP / CLI / Webhook 的技术关系与应用场景规格说明

版本：v1.0

项目名称：WebHot

文档类型：系统接口层与 Agent 自动化集成规格说明书

核心目标：

```text
明确 MCP、CLI、Webhook 三种能力在 WebHot 中的边界、关系、职责与应用场景，
构建一个既支持 Agent 主动查询，又支持事件主动触发，还支持脚本自动化调用的完整接口体系。
```

---

# 1. 背景

WebHot 的最终目标是：

```text
持续观察世界
→ 记录世界变化
→ 构建 Timeline
→ 维护 World State
→ 生成 Signal
→ 服务 AI Agent 自动化
```

为了让 AI Agent 能真正使用 WebHot，系统不能只提供单一 API。

因为不同类型的自动化场景需要不同的交互模式：

- Agent 想主动查询热点，需要 MCP
- Shell / GitHub Actions / Cron 想自动调用，需要 CLI
- WebHot 发现新变化后想主动通知 Agent，需要 Webhook

因此，MCP、CLI、Webhook 三者不是互斥关系，而是互补关系。

---

# 2. 三者一句话定义

| 能力 | 一句话定义 | 数据方向 |
|---|---|---|
| MCP | 给 AI Agent 调用的结构化工具接口 | Agent → WebHot |
| CLI | 给脚本、终端、自动化任务调用的命令行接口 | Script → WebHot |
| Webhook | WebHot 发现变化后主动推送给外部系统 | WebHot → Agent/System |

---

# 3. 三者本质区别

## 3.1 MCP 是 Agent 查询工具

MCP 的核心作用是：

```text
让 Agent 能主动查询 WebHot 的世界状态、热点、Timeline、Signal。
```

例如：

```text
Agent：现在 AI 世界有什么重要变化？
Agent 调用：webhot.get_world_state
```

MCP 的特点：

- 面向 AI Agent
- 结构化工具调用
- 适合语义查询
- 适合多轮推理
- 适合在 Agent 工作流中动态使用

---

## 3.2 CLI 是自动化脚本入口

CLI 的核心作用是：

```text
让任何脚本、终端、Cron、GitHub Actions、Docker Job 可以直接调用 WebHot。
```

例如：

```bash
webhot timeline "MCP"
webhot signals --category ai --json
webhot state --format markdown
```

CLI 的特点：

- 面向开发者和自动化脚本
- 易于集成到 Shell
- 适合 GitHub Actions
- 适合 Cron 定时任务
- 适合 Agent Shell 工具调用
- 适合本地调试

---

## 3.3 Webhook 是事件主动通知机制

Webhook 的核心作用是：

```text
当 WebHot 发现新的热点、Timeline 节点或重要 Signal 时，主动通知 Agent 或外部系统。
```

例如：

```text
WebHot 发现：MCP 生态突然爆发
→ WebHot 主动 POST 到 Agent Webhook URL
→ Agent 被唤醒
→ Agent 再调用 MCP 查询详情
→ Agent 生成分析报告或推送消息
```

Webhook 的特点：

- 面向事件驱动
- WebHot 主动推送
- 适合唤醒 Agent
- 适合实时通知
- 适合低延迟自动化
- 适合避免高频轮询

---

# 4. 三者是否冲突

结论：

```text
MCP、CLI、Webhook 完全不冲突。
```

它们解决的是三个不同问题：

| 问题 | 解决方式 |
|---|---|
| Agent 想主动查世界 | MCP |
| 脚本想自动查世界 | CLI |
| 世界变化想主动通知 Agent | Webhook |

---

# 5. Pull 与 Push 模型

## 5.1 MCP 是 Pull

```text
Agent 主动拉取 WebHot 数据
```

流程：

```text
Agent
  ↓
MCP Tool Call
  ↓
WebHot MCP Server
  ↓
World State / Timeline / Signal
```

---

## 5.2 CLI 也是 Pull

```text
脚本主动拉取 WebHot 数据
```

流程：

```text
Shell / Cron / GitHub Actions
  ↓
webhot CLI
  ↓
WebHot API
  ↓
World State / Timeline / Signal
```

---

## 5.3 Webhook 是 Push

```text
WebHot 主动推送世界变化
```

流程：

```text
WebHot Worker
  ↓
Signal Engine
  ↓
Webhook Dispatcher
  ↓
Agent Endpoint
  ↓
Agent Workflow
```

---

# 6. WebHot 中的整体关系

```text
                  外部世界
                      ↓
              Source Adapters
                      ↓
             Perception Engine
                      ↓
             Change Database
                      ↓
              Timeline Engine
                      ↓
             World State Engine
                      ↓
               Signal Engine
                      ↓
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
      MCP            CLI          Webhook
       ↓              ↓              ↓
  AI Agent       Script/Job     Agent Wakeup
```

---

# 7. 在 WebHot 中的职责边界

## 7.1 MCP 的职责边界

MCP 负责：

- 查询当前世界状态
- 查询热点列表
- 查询某个 Topic 的 Timeline
- 查询 Signal
- 查询金融 / AI / MCP / Agent 领域热点
- 解释某个热点为什么重要
- 为 Agent 提供结构化上下文

MCP 不负责：

- 定时轮询外部网站
- 主动推送事件
- 长期任务调度
- 直接发送通知

---

## 7.2 CLI 的职责边界

CLI 负责：

- 命令行查询
- 本地调试
- 脚本自动化
- GitHub Actions 调用
- Cron 定时调用
- Docker Job 调用
- 输出 JSON / Markdown / Text

CLI 不负责：

- Agent 原生工具协议
- 实时事件推送
- 长期世界状态维护

---

## 7.3 Webhook 的职责边界

Webhook 负责：

- 事件触发
- 主动通知
- 唤醒 Agent
- 发送 Signal
- 通知 Timeline 更新
- 通知 Topic 爆发
- 通知数据源异常

Webhook 不负责：

- 深度查询
- 大量数据返回
- 复杂推理
- 多轮上下文交互

Webhook 的 Payload 应该短小、清晰、可追踪。

Webhook 通常只发送：

```text
发生了什么 + 为什么重要 + 去哪里查询详情
```

而不是发送完整世界状态。

---

# 8. 推荐组合方式

WebHot 最推荐的组合方式是：

```text
Webhook 负责唤醒 Agent
MCP 负责让 Agent 深挖
CLI 负责自动化脚本调用
```

典型流程：

```text
1. WebHot 持续观察世界
2. Signal Engine 发现重要变化
3. Webhook 主动通知 Agent
4. Agent 收到通知后被唤醒
5. Agent 调用 MCP 查询 Timeline / World State / Signal
6. Agent 分析并生成报告或推送
7. 必要时 CLI 用于 GitHub Actions / Cron / 本地调试
```

---

# 9. MCP 在 WebHot 中的典型工具设计

## 9.1 webhot.get_world_state

用途：

```text
获取当前世界状态。
```

适合问题：

- 今天 AI 世界发生了什么？
- 当前金融世界有哪些热点？
- 哪些 Topic 正在快速升温？

参数示例：

```json
{
  "category": "AI",
  "region": "global",
  "limit": 20
}
```

---

## 9.2 webhot.get_topic_timeline

用途：

```text
获取某个热点事件的时间线。
```

参数示例：

```json
{
  "query": "MCP",
  "time_range": "7d"
}
```

返回内容：

- 首次发现时间
- 关键传播节点
- 平台扩散路径
- 热度变化
- 相关事件

---

## 9.3 webhot.get_signals

用途：

```text
获取系统生成的重要变化信号。
```

参数示例：

```json
{
  "type": "explosion",
  "category": "AI",
  "min_level": "high"
}
```

---

## 9.4 webhot.explain_topic

用途：

```text
解释某个热点为什么重要。
```

Agent 可用它生成分析报告。

---

## 9.5 webhot.search_topics

用途：

```text
搜索 WebHot 已维护的 Topic 世界状态，而不是普通网页搜索。
```

---

# 10. CLI 在 WebHot 中的命令设计

## 10.1 查询世界状态

```bash
webhot state
```

JSON 输出：

```bash
webhot state --json
```

---

## 10.2 查询热点信号

```bash
webhot signals
```

筛选 AI：

```bash
webhot signals --category ai
```

---

## 10.3 查询 Timeline

```bash
webhot timeline "MCP"
```

输出 Markdown：

```bash
webhot timeline "MCP" --format markdown
```

---

## 10.4 查询金融热点

```bash
webhot finance
```

---

## 10.5 查询 AI 热点

```bash
webhot ai
```

---

## 10.6 用于 GitHub Actions

```yaml
name: WebHot Daily Digest

on:
  schedule:
    - cron: "0 0 * * *"

jobs:
  digest:
    runs-on: ubuntu-latest
    steps:
      - name: Install WebHot CLI
        run: npm install -g webhot-cli

      - name: Generate AI Digest
        run: webhot ai --format markdown > ai-digest.md
```

---

# 11. Webhook 在 WebHot 中的事件设计

## 11.1 推荐事件类型

```text
topic.created
topic.updated
topic.exploding
timeline.updated
signal.created
signal.ai
signal.finance
signal.mcp
signal.risk
source.failed
source.recovered
```

---

## 11.2 topic.created

含义：

```text
系统发现新的 Topic。
```

适合触发：

- Agent 建立观察任务
- Agent 判断是否需要继续追踪

---

## 11.3 topic.exploding

含义：

```text
某个 Topic 在短时间内热度爆发。
```

适合触发：

- 高优先级 Agent 分析
- 实时推送
- 金融/AI 专题判断

---

## 11.4 timeline.updated

含义：

```text
某个 Topic 的时间线出现新关键节点。
```

适合触发：

- Agent 更新已有报告
- Agent 重新评估事件影响
- Agent 推送“后续进展”

---

## 11.5 signal.created

含义：

```text
Signal Engine 生成新的重要信号。
```

适合触发：

- 自动化工作流
- Agent 分析链路
- 通知系统

---

# 12. Webhook Payload 标准

## 12.1 基础结构

```json
{
  "event": "timeline.updated",
  "event_id": "evt_20260506_001",
  "created_at": "2026-05-06T15:30:00+08:00",
  "source": "webhot",
  "level": "high",
  "topic": {
    "id": "topic_mcp_20260506",
    "title": "MCP 生态持续升温",
    "category": "AI.Agent.MCP"
  },
  "summary": "GitHub、X、Hacker News 同时出现 MCP 相关新增讨论。",
  "reason": "跨平台扩散 + GitHub Trending 新项目 + X 热帖增长。",
  "recommended_action": "agent_analyze_topic",
  "links": {
    "mcp_tool": "webhot.get_topic_timeline",
    "api": "/topics/topic_mcp_20260506/timeline"
  }
}
```

---

## 12.2 Webhook 设计原则

Webhook Payload 应满足：

- 短小
- 明确
- 可追踪
- 可重试
- 可幂等
- 可被 Agent 直接理解

不建议 Webhook Payload 返回大量原始数据。

原因：

```text
Webhook 用来通知变化，不用来承载完整上下文。
```

完整上下文应由 Agent 再通过 MCP 或 API 查询。

---

# 13. Webhook 安全机制

## 13.1 签名验证

Webhook 应支持签名：

```http
X-WebHot-Signature: sha256=xxxxx
```

签名内容：

```text
HMAC_SHA256(secret, raw_body)
```

---

## 13.2 重试机制

失败后重试策略：

```text
1分钟后重试
5分钟后重试
15分钟后重试
1小时后重试
```

---

## 13.3 幂等机制

每个事件必须有：

```text
event_id
```

接收端可根据 event_id 去重。

---

## 13.4 超时机制

Webhook 请求建议：

```text
3~10 秒超时
```

超时后进入重试队列。

---

# 14. 三者协同的典型场景

## 14.1 场景一：AI 热点爆发

```text
1. WebHot 观察到某 AI Agent 项目进入 GitHub Trending
2. X 上同时出现多个相关讨论
3. Signal Engine 生成 signal.ai
4. Webhook 推送给 AI Research Agent
5. Agent 调用 MCP get_topic_timeline
6. Agent 调用 MCP explain_topic
7. Agent 生成分析摘要
8. Agent 推送到 Telegram / 飞书
```

---

## 14.2 场景二：金融热点变化

```text
1. WebHot 发现“HBM 涨价”在多个平台升温
2. Timeline 新增财经媒体报道节点
3. Signal Engine 生成 signal.finance
4. Webhook 唤醒 Finance Agent
5. Finance Agent 调用 MCP 获取 Timeline
6. Finance Agent 调用 MCP 获取相关 Topic
7. Agent 输出：事件、影响链、风险、观察点
```

---

## 14.3 场景三：GitHub Actions 每日摘要

```text
1. GitHub Actions 每天 8 点运行
2. 调用 webhot CLI
3. 获取 AI / Finance / MCP 三类热点
4. 生成 Markdown 日报
5. 推送到仓库或消息渠道
```

---

## 14.4 场景四：Agent 主动查询世界

```text
用户问：今天 MCP 世界有什么变化？
Agent 调用 MCP：webhot.get_world_state
Agent 调用 MCP：webhot.get_topic_timeline("MCP")
Agent 总结回答
```

---

# 15. 推荐工程实现架构

```text
apps/
  api/              REST API 服务
  mcp/              MCP Server
  cli/              CLI 工具
  worker/           采集与感知任务
  webhook-worker/   Webhook 分发任务

packages/
  core/             核心业务逻辑
  schemas/          统一数据结构
  storage/          数据存储
  signal/           信号引擎
  timeline/         时间线引擎
  world-state/      世界状态引擎
  sdk/              TypeScript SDK
```

---

# 16. 推荐运行模式

## 16.1 本地开发模式

```text
SQLite
Local Redis
Local MCP Server
Local CLI
```

---

## 16.2 轻量部署模式

```text
Docker Compose
PostgreSQL
Redis
Worker
MCP Server
API Server
Webhook Worker
```

---

## 16.3 Agent 自动化模式

```text
WebHot Worker 持续观察
Webhook 唤醒 Agent
Agent 通过 MCP 深挖
CLI 用于定时摘要与脚本任务
```

---

# 17. 三者优先级建议

## MVP 阶段

优先级：

```text
1. CLI
2. MCP
3. Webhook
```

原因：

- CLI 最容易测试和调试
- MCP 是 Agent 使用核心
- Webhook 需要稳定的 Signal Engine 后再做

---

## 成熟阶段

优先级应变为：

```text
1. Webhook
2. MCP
3. CLI
```

原因：

成熟后真正高价值的是：

```text
事件驱动 Agent
```

即：

```text
世界变化主动唤醒 Agent
```

---

# 18. 最终架构结论

MCP、CLI、Webhook 在 WebHot 中分别对应：

```text
MCP     = Agent 查询世界
CLI     = 脚本调用世界
Webhook = 世界通知 Agent
```

三者组合后，WebHot 才能形成完整闭环：

```text
持续观察世界
→ 发现变化
→ 生成 Signal
→ Webhook 唤醒 Agent
→ Agent 调 MCP 深度查询
→ CLI 支持自动化任务
→ Agent 输出报告/通知/行动
```

最终，WebHot 不只是一个热点系统。

而是：

```text
AI Agent 的实时世界事件总线
```

以及：

```text
持续观察世界的自动化基础设施
```

