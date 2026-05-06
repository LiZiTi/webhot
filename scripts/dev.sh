#!/usr/bin/env bash
# WebHot 开发环境一键启动
# 用法: ./scripts/dev.sh [api|mcp|worker|webhook|all]
set -euo pipefail

SERVICE="${1:-all}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"
resolve_pnpm

run_dev() {
  local workspace="$1"
  local entry="$2"
  (cd "$workspace" && corepack pnpm exec tsx watch "$entry")
}

# 确保数据目录存在
mkdir -p data

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m'

banner() {
  if [ -t 1 ]; then
    clear
  fi
  echo -e "${CYAN}╭────────────────────────────────────────────────────────╮${NC}"
  echo -e "${CYAN}│${NC} ${GREEN}WebHot Development Launcher${NC}                           ${CYAN}│${NC}"
  echo -e "${CYAN}│${NC} ${GRAY}Live world-state engine for AI agents${NC}                ${CYAN}│${NC}"
  echo -e "${CYAN}│${NC} ${YELLOW}mode:${NC} ${SERVICE}                                             ${CYAN}│${NC}"
  echo -e "${CYAN}╰────────────────────────────────────────────────────────╯${NC}"
}

runtime_overview() {
  local node_version
  local pnpm_version
  local redis_state="ready"

  node_version="$(node -v 2>/dev/null || echo 'n/a')"
  if command -v pnpm &>/dev/null; then
    pnpm_version="$(pnpm -v)"
  else
    pnpm_version="${PNPM_CMD[*]}"
  fi

  if ! redis-cli ping &>/dev/null 2>&1; then
    redis_state="offline"
  fi

  echo -e "${CYAN}Runtime${NC}"
  echo -e "  ${GREEN}•${NC} node   ${GRAY}→${NC} ${node_version}"
  echo -e "  ${GREEN}•${NC} pnpm   ${GRAY}→${NC} ${pnpm_version}"
  echo -e "  ${GREEN}•${NC} redis  ${GRAY}→${NC} ${redis_state}"
  echo ""
}

service_overview() {
  echo -e "${CYAN}Services${NC}"
  echo -e "  ${GREEN}•${NC} api     ${GRAY}→${NC} http://localhost:3000"
  echo -e "  ${GREEN}•${NC} worker  ${GRAY}→${NC} Redis-backed fetch scheduler"
  echo -e "  ${GREEN}•${NC} webhook ${GRAY}→${NC} event dispatcher"
  echo -e "  ${GREEN}•${NC} mcp     ${GRAY}→${NC} stdio"
  echo ""
}

case "$SERVICE" in
  api)
    banner
    echo -e "${GREEN}▶${NC} API server"
    run_dev "apps/api" "src/index.ts"
    ;;
  mcp)
    banner
    echo -e "${GREEN}▶${NC} MCP server"
    run_dev "apps/mcp" "src/index.ts"
    ;;
  worker)
    banner
    echo -e "${GREEN}▶${NC} Worker"
    if ! redis-cli ping &>/dev/null 2>&1; then
      echo -e "${RED}✖${NC} Redis 未运行. 启动: docker run -d -p 6379:6379 redis:7-alpine"
      exit 1
    fi
    run_dev "apps/worker" "src/index.ts"
    ;;
  webhook)
    banner
    echo -e "${GREEN}▶${NC} Webhook worker"
    run_dev "apps/webhook-worker" "src/index.ts"
    ;;
  all)
    banner
    if ! redis-cli ping &>/dev/null 2>&1; then
      echo -e "${RED}✖${NC} Redis 未运行. 启动: docker run -d -p 6379:6379 redis:7-alpine"
      exit 1
    fi

    runtime_overview
    service_overview
    echo -e "${YELLOW}Starting services in parallel...${NC}"

    run_dev "apps/api" "src/index.ts" &
    PID_API=$!
    echo -e "  ${GREEN}✓${NC} api     PID ${PID_API}"

    run_dev "apps/worker" "src/index.ts" &
    PID_WORKER=$!
    echo -e "  ${GREEN}✓${NC} worker  PID ${PID_WORKER}"

    run_dev "apps/webhook-worker" "src/index.ts" &
    PID_WEBHOOK=$!
    echo -e "  ${GREEN}✓${NC} webhook PID ${PID_WEBHOOK}"

    run_dev "apps/mcp" "src/index.ts" &
    PID_MCP=$!
    echo -e "  ${GREEN}✓${NC} mcp     PID ${PID_MCP}"

    echo ""
    echo -e "${GREEN}All services are up.${NC}  ${YELLOW}Press Ctrl+C to stop.${NC}"
    trap "kill $PID_API $PID_WORKER $PID_WEBHOOK $PID_MCP 2>/dev/null; exit 0" INT TERM
    wait
    ;;
  *)
    echo "用法: $0 [api|mcp|worker|webhook|all]"
    exit 1
    ;;
esac
