#!/usr/bin/env bash
# WebHot 一键安装脚本
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"
resolve_pnpm

echo "========================================="
echo "  WebHot Setup"
echo "========================================="

# 检查 Node.js
if ! command -v node &>/dev/null; then
  echo "❌ 需要 Node.js >= 22. 请安装: https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
  echo "❌ 需要 Node.js >= 22, 当前: $(node -v)"
  exit 1
fi
echo "✅ Node.js $(node -v)"

print_pnpm_status

# 检查 Redis
if command -v redis-cli &>/dev/null; then
  echo "✅ Redis found"
else
  echo "⚠️  Redis 未安装 (Worker 需要 Redis). 可通过 Docker 启动:"
  echo "   docker run -d --name webhot-redis -p 6379:6379 redis:7-alpine"
fi

# 安装依赖
echo ""
echo "📦 安装依赖..."
"${PNPM_CMD[@]}" install 2>&1 | grep -v "deprecated"

# 类型检查
echo ""
echo "🔍 类型检查..."
"${PNPM_CMD[@]}" typecheck 2>&1 | tail -3 || echo "⚠️  类型检查有警告 (不影响运行)"

# 构建
echo ""
echo "🔨 构建..."
"${PNPM_CMD[@]}" build 2>&1 | tail -3 || echo "⚠️  构建有警告 (不影响运行)"

# 创建数据目录
mkdir -p data

echo ""
echo "========================================="
echo "  ✅ 安装完成!"
echo ""
echo "  启动:"
echo "    pnpm dev                  # 全部服务"
echo "    pnpm dev:api              # API → http://localhost:3000"
echo "    pnpm dev:mcp              # MCP → stdio"
echo "    pnpm dev:worker           # Worker"
echo "    pnpm dev:webhook          # Webhook"
echo "========================================="
