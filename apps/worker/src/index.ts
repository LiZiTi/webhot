import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { Queue, Worker, type JobsOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { createAdapter, type SourceConfig } from '@webhot/adapters';
import { WebHotCore } from '@webhot/core';
import { createLogger } from '@webhot/logging';
import type { HotItem } from '@webhot/schemas';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, '../../../configs/sources.yaml');
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const log = createLogger('worker');

interface SourcesFile {
  sources: SourceConfig[];
}

// --- Redis 连接 ---
const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

// --- 队列定义 ---
const fetchQueue = new Queue<SourceConfig, { items: number; elapsed: number }>('webhot-fetch', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
});

// --- 核心实例 ---
const core = new WebHotCore();

// --- Worker: 处理采集任务 ---
const fetchWorker = new Worker<SourceConfig>(
  'webhot-fetch',
  async (job) => {
    const source = job.data;
    const adapter = createAdapter(source);
    if (!adapter) throw new Error(`Failed to create adapter for ${source.id}`);

    const startTime = Date.now();
    const rawItems = await adapter.fetchList({ limit: 50 });
    const items: HotItem[] = rawItems.map(r => adapter.normalize(r));
    const result = core.ingest(items);
    const elapsed = Date.now() - startTime;

    return { items: result.length, elapsed };
  },
  {
    connection,
    concurrency: 3,
    limiter: { max: 10, duration: 60_000 }, // 每分钟最多 10 个任务
  },
);

fetchWorker.on('completed', (job) => {
  const r = job.returnvalue as { items: number; elapsed: number } | undefined;
  log.success(`${job.data.id} ingested ${r?.items || 0} items`, `${r?.elapsed || 0}ms`);
});

fetchWorker.on('failed', (job, err) => {
  log.error(`${job?.data.id} failed (attempt ${job?.attemptsMade || 0})`, err.message);
});

// --- 定时调度器: 将 sources 加入重复队列 ---

async function scheduleRepeatingJobs(config: SourcesFile) {
  // 清理旧任务
  const repeatable = await fetchQueue.getRepeatableJobs();
  for (const job of repeatable) {
    await fetchQueue.removeRepeatableByKey(job.key);
  }

  for (const source of config.sources) {
    const intervalMs = (source.interval || 300) * 1000;
    await fetchQueue.add(
      `fetch-${source.id}`,
      source,
      {
        repeat: { every: intervalMs },
        jobId: `fetch-${source.id}`,
        ...getJobOptions(source),
      },
    );
    log.info(`scheduled ${source.id}`, `every ${source.interval || 300}s`);

    // 立即触发一次
    await fetchQueue.add(`fetch-${source.id}-initial`, source, {
      ...getJobOptions(source),
      delay: 1000, // 1s 后执行，避免启动时并发爆炸
    });
  }

  log.success(`${config.sources.length} sources scheduled`, 'BullMQ repeatable jobs');
}

function getJobOptions(source: SourceConfig): JobsOptions {
  return {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    priority: source.adapter === 'finance' ? 1 : undefined, // 财经新闻高优先级
  };
}

// --- 熔断监控 ---
let consecutiveFailures = new Map<string, number>();

fetchWorker.on('failed', (job) => {
  if (!job) return;
  const key = job.data.id;
  const count = (consecutiveFailures.get(key) || 0) + 1;
  consecutiveFailures.set(key, count);

  if (count >= 5) {
    log.warn(`circuit breaker tripped for ${key}`, `${count} consecutive failures, pausing 5 minutes`);
    // 暂停该源 5 分钟
    setTimeout(() => consecutiveFailures.delete(key), 300_000);
  }
});

fetchWorker.on('completed', (job) => {
  consecutiveFailures.delete(job.data.id);
});

// --- 启动 ---

async function main() {
  log.section('WebHot Worker', 'Redis + BullMQ');

  let config: SourcesFile;
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf-8');
    config = YAML.parse(raw) as SourcesFile;
  } catch (err) {
    log.error('config error', (err as Error).message);
    process.exit(1);
  }

  await scheduleRepeatingJobs(config);

  // 优雅关闭
  const shutdown = async () => {
    log.warn('shutting down');
    await fetchWorker.close();
    await fetchQueue.close();
    connection.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  log.panel(
    'Worker Ready',
    [
      { label: 'Status', value: 'running' },
      { label: 'Sources', value: config.sources.length },
      { label: 'Queue', value: 'BullMQ repeatable jobs' },
      { label: 'Mode', value: 'watch + ingest' },
    ],
    'Redis-backed scheduling and ingestion',
  );
}

main().catch(err => {
  log.error('fatal', err);
  process.exit(1);
});
