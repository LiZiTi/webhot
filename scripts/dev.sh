#!/usr/bin/env bash
# WebHot 开发环境一键启动
# 用法: ./scripts/dev.sh [api|mcp|worker|webhook|all]
set -euo pipefail

SERVICE="${1:-all}"

# 确保数据目录存在
mkdir -p data

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

start_service() {
  local name=$1
  local cmd=$2
  echo -e "${GREEN}[${name}]${NC} starting..."
  $cmd &
  PID=$!
  # 注册清理
  trap "kill $PID 2>/dev/null; exit 0" INT TERM
  wait $PID
}

case "$SERVICE" in
  api)
    echo -e "${YELLOW}Starting API Server...${NC}"
    pnpm dev:api
    ;;
  mcp)
    echo -e "${YELLOW}Starting MCP Server...${NC}"
    pnpm dev:mcp
    ;;
  worker)
    echo -e "${YELLOW}Starting Worker...${NC}"
    # 检查 Redis
    if ! redis-cli ping &>/dev/null 2>&1; then
      echo -e "${RED}❌ Redis 未运行. 启动: docker run -d -p 6379:6379 redis:7-alpine${NC}"
      exit 1
    fi
    pnpm dev:worker
    ;;
  webhook)
    echo -e "${YELLOW}Starting Webhook Worker...${NC}"
    pnpm dev:webhook
    ;;
  all)
    echo -e "${YELLOW}Starting all services...${NC}"
    echo ""
    # 后台启动
    pnpm dev:api &
    PID_API=$!
    echo -e "${GREEN}[api]${NC} PID=$PID_API → http://localhost:3000"

    pnpm dev:worker &
    PID_WORKER=$!
    echo -e "${GREEN}[worker]${NC} PID=$PID_WORKER"

    pnpm dev:webhook &
    PID_WEBHOOK=$!
    echo -e "${GREEN}[webhook]${NC} PID=$PID_WEBHOOK"

    pnpm dev:mcp &
    PID_MCP=$!
    echo -e "${GREEN}[mcp]${NC} PID=$PID_MCP → stdio"

    echo ""
    echo -e "${YELLOW}所有服务已启动. Ctrl+C 停止全部.${NC}"

    # 等待任意进程退出
    trap "kill $PID_API $PID_WORKER $PID_WEBHOOK $PID_MCP 2>/dev/null; exit 0" INT TERM
    wait
    ;;
  *)
    echo "用法: $0 [api|mcp|worker|webhook|all]"
    exit 1
    ;;
esac
