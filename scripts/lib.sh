#!/usr/bin/env bash

# Resolve a usable pnpm invocation for local scripts.
# Prefer an installed pnpm binary, then corepack, then npx as a last resort.
resolve_pnpm() {
  if command -v pnpm &>/dev/null; then
    PNPM_CMD=(pnpm)
    return 0
  fi

  if command -v corepack &>/dev/null && corepack pnpm --version &>/dev/null; then
    PNPM_CMD=(corepack pnpm)
    return 0
  fi

  PNPM_CMD=(npx pnpm)
}

print_pnpm_status() {
  if command -v pnpm &>/dev/null; then
    echo "✅ pnpm $(pnpm -v)"
    return 0
  fi

  if command -v corepack &>/dev/null && corepack pnpm --version &>/dev/null; then
    echo "✅ pnpm $(corepack pnpm -v)"
    return 0
  fi

  echo "⚠️  pnpm 未安装，且 corepack 无法直接提供 pnpm"
  echo "   手动安装: npm install -g pnpm"
  echo "   本次将使用 npx pnpm (临时)"
}
