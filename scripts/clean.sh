#!/usr/bin/env bash
# WebHot 清理脚本
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"
resolve_pnpm

echo "🧹 Cleaning WebHot..."

# 清理构建产物
echo "  → dist/"
"${PNPM_CMD[@]}" clean 2>/dev/null || true
find . -name "dist" -type d -not -path "./node_modules/*" -exec rm -rf {} + 2>/dev/null || true

# 清理 TypeScript 增量文件
echo "  → *.tsbuildinfo"
find . -name "*.tsbuildinfo" -not -path "./node_modules/*" -delete 2>/dev/null || true

# 清理数据库
if [ -f "data/webhot.db" ]; then
  read -p "  删除 data/webhot.db? [y/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f data/webhot.db data/webhot.db-wal data/webhot.db-shm
    echo "  ✅ 数据库已删除"
  fi
fi

# 清理日志
echo "  → logs/"
rm -rf logs/ 2>/dev/null || true

# 清理 node_modules (可选)
if [ "${1:-}" = "--full" ]; then
  echo "  → node_modules/"
  rm -rf node_modules/ packages/*/node_modules/ apps/*/node_modules/ 2>/dev/null || true
  echo "  ✅ node_modules 已清理"
fi

echo ""
echo "✅ 清理完成"
