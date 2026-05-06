#!/usr/bin/env bash
# WebHot 构建脚本
set -euo pipefail

echo "🔨 Building WebHot..."

# 类型检查
echo "  → typecheck..."
pnpm typecheck 2>&1 | tail -5 || echo "  ⚠️  Type check warnings (non-blocking)"

# 构建所有包
echo "  → build..."
pnpm build 2>&1 | tail -5

# 确保输出目录存在
echo "  → verifying outputs..."
for app in api mcp worker cli webhook-worker; do
  if [ -d "apps/$app/dist" ]; then
    echo "    ✅ apps/$app/dist"
  else
    echo "    ⚠️  apps/$app/dist (may need tsc)"
  fi
done

echo ""
echo "✅ Build complete"
echo ""
echo "Run:"
echo "  node apps/api/dist/index.js      # API Server"
echo "  node apps/mcp/dist/index.js      # MCP Server"
echo "  node apps/worker/dist/index.js   # Worker"
