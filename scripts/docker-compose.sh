#!/usr/bin/env bash
# WebHot Docker 管理脚本
set -euo pipefail

ACTION="${1:-up}"

case "$ACTION" in
  up)
    echo "🐳 Starting WebHot services..."
    docker compose up -d
    echo ""
    echo "等待服务就绪..."
    sleep 3
    echo ""
    echo "服务状态:"
    docker compose ps
    echo ""
    echo "API: http://localhost:3000"
    echo "健康检查: curl http://localhost:3000/health"
    ;;
  down)
    echo "🛑 Stopping WebHot services..."
    docker compose down
    ;;
  restart)
    echo "🔄 Restarting..."
    docker compose restart
    ;;
  logs)
    SERVICE="${2:-}"
    if [ -n "$SERVICE" ]; then
      docker compose logs -f "$SERVICE"
    else
      docker compose logs -f
    fi
    ;;
  build)
    echo "🔨 Rebuilding images..."
    docker compose build --no-cache
    ;;
  status)
    docker compose ps
    ;;
  *)
    echo "用法: $0 [up|down|restart|logs|build|status]"
    echo ""
    echo "  up      启动所有服务"
    echo "  down    停止所有服务"
    echo "  restart 重启"
    echo "  logs    查看日志 (可指定服务: $0 logs worker)"
    echo "  build   重建镜像"
    echo "  status  查看状态"
    ;;
esac
