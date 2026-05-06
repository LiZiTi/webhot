#!/usr/bin/env node
import { Command } from 'commander';

const API_URL = process.env.WEBHOT_API_URL || 'http://localhost:3000';

async function apiCall(path: string): Promise<unknown> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function print(data: unknown, format: 'json' | 'markdown' | 'text'): void {
  if (format === 'json') {
    console.log(JSON.stringify(data, null, 2));
  } else if (format === 'markdown') {
    console.log(formatMarkdown(data));
  } else {
    console.log(formatText(data));
  }
}

function formatText(data: unknown): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return '(empty)';
    return data.map((item: Record<string, unknown>, i: number) =>
      `${i + 1}. ${item.title || item.id || '-'} [${(item as any).platform || (item as any).type || '?'}]`
    ).join('\n');
  }
  if (data && typeof data === 'object' && 'signals' in data) {
    return formatText((data as any).signals);
  }
  if (data && typeof data === 'object' && 'items' in data) {
    return formatText((data as any).items);
  }
  if (data && typeof data === 'object' && 'topics' in data) {
    return formatText((data as any).topics);
  }
  return JSON.stringify(data, null, 2);
}

function formatMarkdown(data: unknown): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return '_No results._';
    return data.map((item: Record<string, unknown>, i: number) =>
      `### ${i + 1}. ${item.title || item.id || '-'}\n` +
      `- 平台: ${(item as any).platform || '?'}\n` +
      `- 热度: ${(item as any).heatScore || (item as any).score || '?'}\n` +
      `- URL: ${(item as any).url || '?'}\n`
    ).join('\n');
  }
  if (data && typeof data === 'object' && 'items' in data) {
    return formatMarkdown((data as any).items);
  }
  if (data && typeof data === 'object' && 'signals' in data) {
    return formatMarkdown((data as any).signals);
  }
  if (data && typeof data === 'object' && 'topics' in data) {
    return formatMarkdown((data as any).topics);
  }
  return '```json\n' + JSON.stringify(data, null, 2) + '\n```';
}

const program = new Command();
program.name('webhot').description('WebHot — AI Agent 热点情报 CLI').version('0.1.0');

// state — 获取当前世界状态
program.command('state')
  .description('获取当前世界状态')
  .option('--json', 'JSON 输出')
  .option('--markdown', 'Markdown 输出')
  .action(async (opts) => {
    const data = await apiCall('/api/v1/world');
    const fmt = opts.markdown ? 'markdown' : opts.json ? 'json' : 'text';
    print(data, fmt);
  });

// trending — 获取热点趋势
program.command('trending')
  .description('获取当前热点趋势')
  .option('-c, --category <category>', '分类过滤')
  .option('-l, --limit <number>', '返回数量', '20')
  .option('--json', 'JSON 输出')
  .option('--markdown', 'Markdown 输出')
  .action(async (opts) => {
    const qs = new URLSearchParams();
    if (opts.category) qs.set('category', opts.category);
    qs.set('limit', opts.limit);
    const data = await apiCall(`/api/v1/hot?${qs}`);
    const fmt = opts.markdown ? 'markdown' : opts.json ? 'json' : 'text';
    print(data, fmt);
  });

// timeline — 获取话题时间线
program.command('timeline <topic>')
  .description('获取热点事件时间线')
  .option('--json', 'JSON 输出')
  .option('--markdown', 'Markdown 输出')
  .action(async (topic, opts) => {
    const data = await apiCall(`/api/v1/timeline/${topic}`);
    const fmt = opts.markdown ? 'markdown' : opts.json ? 'json' : 'text';
    print(data, fmt);
  });

// ai — AI 趋势信号
program.command('ai')
  .description('获取 AI 生态趋势信号 (Agent/MCP/AI Coding/Claude/OpenAI/Cursor)')
  .option('--json', 'JSON 输出')
  .option('--markdown', 'Markdown 输出')
  .action(async (opts) => {
    const data = await apiCall('/api/v1/signals/ai');
    const fmt = opts.markdown ? 'markdown' : opts.json ? 'json' : 'text';
    print(data, fmt);
  });

// finance — 金融热点信号
program.command('finance')
  .description('获取金融热点信号 (HBM/GPU/存储涨价/产业链)')
  .option('--json', 'JSON 输出')
  .option('--markdown', 'Markdown 输出')
  .action(async (opts) => {
    const data = await apiCall('/api/v1/signals/finance');
    const fmt = opts.markdown ? 'markdown' : opts.json ? 'json' : 'text';
    print(data, fmt);
  });

// signals — 信号查询 + 分类过滤
program.command('signals')
  .description('获取系统生成的信号 (可按分类过滤)')
  .option('-c, --category <category>', '分类过滤: ai / finance / explosion / risk')
  .option('-l, --limit <number>', '返回数量', '20')
  .option('--json', 'JSON 输出')
  .option('--markdown', 'Markdown 输出')
  .action(async (opts) => {
    let path = '/api/v1/signals';
    if (opts.category) {
      path = `/api/v1/signals/${opts.category}`;
    }
    if (opts.limit && opts.limit !== '20') {
      path += (path.includes('?') ? '&' : '?') + `limit=${opts.limit}`;
    }
    const data = await apiCall(path);
    const fmt = opts.markdown ? 'markdown' : opts.json ? 'json' : 'text';
    print(data, fmt);
  });

// world — 世界状态 (别名)
program.command('world')
  .description('获取当前世界状态 (state 别名)')
  .option('--json', 'JSON 输出')
  .option('--markdown', 'Markdown 输出')
  .action(async (opts) => {
    const data = await apiCall('/api/v1/world');
    const fmt = opts.markdown ? 'markdown' : opts.json ? 'json' : 'text';
    print(data, fmt);
  });

program.parse();
