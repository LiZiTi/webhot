#!/usr/bin/env bash
# WebHot 生产模式启动脚本
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PID_DIR="$PROJECT_DIR/.pids"

mkdir -p "$PID_DIR"

REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
API_URL="${API_URL:-http://localhost:3000}"
DATA_DIR="$PROJECT_DIR/data"

# 检查 Redis
check_redis() {
  if redis-cli -u "$REDIS_URL" ping &>/dev/null 2>&1; then
    return 0
  fi
  # 尝试不带密码的本地 Redis
  if redis-cli ping &>/dev/null 2>&1; then
    return 0
  fi
  return 1
}

start_service() {
  local name=$1
  local dir=$2
  local cmd=$3
  local pid_file="$PID_DIR/$name.pid"

  if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    echo "  ⏭   $name 已在运行 (pid $(cat "$pid_file"))"
    return
  fi

  echo "  ▶  启动 $name..."
  cd "$PROJECT_DIR"
  nohup $cmd > "logs/$name.log" 2>&1 &
  echo $! > "$pid_file"
  echo "     PID $(cat "$pid_file") | 日志: logs/$name.log"
}

stop_service() {
  local name=$1
  local pid_file="$PID_DIR/$name.pid"

  if [ ! -f "$pid_file" ]; then
    echo "  ⏭   $name 未运行"
    return
  fi

  local pid=$(cat "$pid_file")
  if kill -0 "$pid" 2>/dev/null; then
    echo "  ⏹   停止 $name (pid $pid)..."
    kill "$pid" 2>/dev/null
    sleep 1
    kill -9 "$pid" 2>/dev/null || true
  fi
  rm -f "$pid_file"
  echo "     $name 已停止"
}

ACTION="${1:-start}"

case "$ACTION" in
  start)
    echo "🚀 WebHot 启动中..."
    mkdir -p "$PROJECT_DIR/logs" "$DATA_DIR"

    if ! check_redis; then
      echo "❌ Redis 未运行. 请先启动 Redis:"
      echo "   docker run -d --name webhot-redis -p 6379:6379 redis:7-alpine"
      exit 1
    fi
    echo "✅ Redis 正常"

    # API Server
    start_service "api" "apps/api" \
      "npx tsx apps/api/src/index.ts"

    # Worker
    start_service "worker" "apps/worker" \
      "REDIS_URL=$REDIS_URL npx tsx apps/worker/src/index.ts"

    # Webhook Worker
    start_service "webhook" "apps/webhook-worker" \
      "REDIS_URL=$REDIS_URL npx tsx apps/webhook-worker/src/index.ts"

    echo ""
    echo "✅ 全部启动完成"
    echo ""
    echo "   API:     http://localhost:3000"
    echo "   健康检查: curl http://localhost:3000/health"
    echo "   查看日志: tail -f logs/api.log"
    echo "   查看状态: $0 status"
    echo "   停止服务: $0 stop"
    ;;

  stop)
    echo "🛑 WebHot 停止中..."
    stop_service "api"
    stop_service "worker"
    stop_service "webhook"
    echo ""
    echo "✅ 全部停止"
    ;;

  restart)
    echo "🔄 重启 WebHot..."
    "$0" stop
    sleep 2
    "$0" start
    ;;

  status)
    echo "📊 WebHot 服务状态"
    echo "---"
    for name in api worker webhook; do
      local pid_file="$PID_DIR/$name.pid"
      if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
        echo "  ✅ $name — PID $(cat "$pid_file")"
      else
        echo "  ❌ $name — 未运行"
      fi
    done
    ;;

  *)
    echo "用法: $0 [start|stop|restart|status]"
    echo ""
    echo "  start    启动全部服务 (API + Worker + Webhook)"
    echo "  stop     停止全部服务"
    echo "  restart  重启全部服务"
    echo "  status   查看服务状态"
    ;;
esac
