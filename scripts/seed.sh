#!/usr/bin/env bash
# WebHot 测试数据填充脚本
# 向 API 发送 mock 热点数据用于开发测试
set -euo pipefail

API_URL="${WEBHOT_API_URL:-http://localhost:3000}"
ENDPOINT="${API_URL}/api/v1/ingest"

echo "🌱 填充测试数据到 ${ENDPOINT}"

# 检查 API 是否运行
if ! curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health" | grep -q "200"; then
  echo "❌ API 未运行. 请先启动: pnpm dev:api"
  exit 1
fi

NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

# Mock 数据
curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
  "items": [
    {
      "id": "seed_mcp_001",
      "source": "github_trending", "platform": "github",
      "title": "modelcontextprotocol/sdk — MCP SDK reaches 20k stars",
      "summary": "The official MCP SDK for building AI agent tools has crossed 20,000 GitHub stars in under 3 months.",
      "url": "https://github.com/modelcontextprotocol/sdk",
      "rank": 1, "heatScore": 95,
      "metrics": { "stars": 20000, "forks": 3000 },
      "collectedAt": "'"$NOW"'", "language": "en", "region": "global"
    },
    {
      "id": "seed_claude_002",
      "source": "hackernews", "platform": "hackernews",
      "title": "Claude Code: Anthropic'\''s new agentic coding tool",
      "summary": "Anthropic releases Claude Code, an agentic coding tool that runs in the terminal with full project context.",
      "url": "https://news.ycombinator.com/item?id=1",
      "rank": 2, "heatScore": 90,
      "metrics": { "likes": 450, "comments": 200 },
      "collectedAt": "'"$NOW"'", "language": "en", "region": "global"
    },
    {
      "id": "seed_hbm_003",
      "source": "finance_news", "platform": "finance",
      "title": "HBM 内存持续涨价，SK 海力士扩产计划加速",
      "summary": "受 AI 算力需求驱动，HBM 内存价格较上月上涨 15%，三星和 SK 海力士纷纷宣布扩产。",
      "url": "https://finance.example.com/hbm-price-surge",
      "rank": 1, "heatScore": 88,
      "metrics": { "views": 12000, "comments": 350 },
      "collectedAt": "'"$NOW"'", "language": "zh", "region": "cn"
    },
    {
      "id": "seed_openai_004",
      "source": "reddit", "platform": "reddit/r/programming",
      "title": "OpenAI announces GPT-5 with native tool use and MCP support",
      "summary": "GPT-5 ships with built-in MCP client, allowing it to connect to any MCP server out of the box.",
      "url": "https://reddit.com/r/programming/openai-gpt5",
      "rank": 1, "heatScore": 92,
      "metrics": { "likes": 3200, "comments": 850 },
      "collectedAt": "'"$NOW"'", "language": "en", "region": "global"
    },
    {
      "id": "seed_cursor_005",
      "source": "twitter", "platform": "twitter",
      "title": "Cursor adds native MCP integration — agents can now access external tools directly",
      "summary": "Cursor IDE launches MCP support, enabling AI agents to connect to databases, APIs, and file systems.",
      "url": "https://x.com/cursor_ai/status/1",
      "rank": 5, "heatScore": 85,
      "metrics": { "likes": 1200, "shares": 400, "comments": 180 },
      "collectedAt": "'"$NOW"'", "language": "en", "region": "global"
    },
    {
      "id": "seed_gpu_006",
      "source": "finance_news", "platform": "finance",
      "title": "英伟达 Blackwell GPU 供不应求，交货周期延长至 12 个月",
      "summary": "NVIDIA Blackwell 系列 GPU 需求远超产能，多家云厂商排队等候，利好国产 GPU 替代概念。",
      "url": "https://finance.example.com/nvidia-blackwell-shortage",
      "rank": 2, "heatScore": 86,
      "metrics": { "views": 8500, "comments": 280 },
      "collectedAt": "'"$NOW"'", "language": "zh", "region": "cn"
    },
    {
      "id": "seed_agent_007",
      "source": "github_trending", "platform": "github",
      "title": "langchain-ai/langgraph — Build stateful, multi-actor agent applications",
      "summary": "LangGraph v1.0 released with production-ready agent orchestration, state management, and human-in-the-loop support.",
      "url": "https://github.com/langchain-ai/langgraph",
      "rank": 3, "heatScore": 82,
      "metrics": { "stars": 15000, "forks": 2000 },
      "collectedAt": "'"$NOW"'", "language": "en", "region": "global"
    },
    {
      "id": "seed_mcp_008",
      "source": "newsnow", "platform": "weibo",
      "title": "MCP 协议成为 AI Agent 基础设施标准，国内多家厂商跟进",
      "summary": "继 OpenAI 和 Anthropic 之后，国内多家 AI 公司宣布支持 MCP 协议，行业标准化进程加速。",
      "url": "https://weibo.com/hot/mcp-standard",
      "rank": 3, "heatScore": 78,
      "metrics": { "views": 50000, "comments": 1200, "shares": 3000 },
      "collectedAt": "'"$NOW"'", "language": "zh", "region": "cn"
    },
    {
      "id": "seed_deepseek_009",
      "source": "hackernews", "platform": "hackernews",
      "title": "DeepSeek V4: Open source model matches GPT-5 on coding benchmarks",
      "summary": "DeepSeek releases V4 with 1M context window and native MCP support, matching proprietary models on coding and reasoning.",
      "url": "https://news.ycombinator.com/item?id=2",
      "rank": 1, "heatScore": 94,
      "metrics": { "likes": 680, "comments": 310 },
      "collectedAt": "'"$NOW"'", "language": "en", "region": "global"
    },
    {
      "id": "seed_storage_010",
      "source": "finance_news", "platform": "finance",
      "title": "存储芯片价格触底反弹，HBM 和 DDR5 需求双轮驱动",
      "summary": "全球存储芯片市场迎来拐点，三星、SK海力士、美光三大巨头股价齐涨。A 股存储板块集体异动。",
      "url": "https://finance.example.com/storage-chip-rebound",
      "rank": 3, "heatScore": 80,
      "metrics": { "views": 6500, "comments": 220 },
      "collectedAt": "'"$NOW"'", "language": "zh", "region": "cn"
    }
  ]
}' | python3 -m json.tool 2>/dev/null || python -m json.tool 2>/dev/null || cat

echo ""
echo "✅ 测试数据已填充"
echo ""
echo "验证:"
echo "  curl ${API_URL}/api/v1/hot | python3 -m json.tool"
echo "  curl ${API_URL}/api/v1/world | python3 -m json.tool"
echo "  curl ${API_URL}/api/v1/signals | python3 -m json.tool"
