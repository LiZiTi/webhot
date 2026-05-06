import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createHmac } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { SignalRepo } from '@webhot/storage';
import type { Signal } from '@webhot/schemas';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- 配置 ---

interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: string[];          // 订阅的事件类型
  retryMax: number;
  timeoutMs: number;
}

interface WebhookPayload {
  event: string;
  event_id: string;
  created_at: string;
  source: string;
  level: 'high' | 'medium' | 'low';
  topic: { id: string; title: string; category: string };
  summary: string;
  reason: string;
  recommended_action: string;
  links: { mcp_tool: string; api: string };
  signal: Signal;
}

// --- HMAC 签名 ---

function signPayload(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

// --- Webhook 分发 ---

class WebhookDispatcher {
  private endpoints: WebhookEndpoint[];
  private signalRepo: SignalRepo;
  private dispatchedSignals: Set<string> = new Set(); // 幂等去重
  private retryQueue: Map<string, { attempt: number; maxRetry: number; payload: WebhookPayload; endpoint: WebhookEndpoint }> = new Map();

  constructor(webhooksConfig: WebhookEndpoint[]) {
    this.endpoints = webhooksConfig;
    this.signalRepo = new SignalRepo();
  }

  /** 生成标准 Webhook Payload */
  buildPayload(signal: Signal, event: string): WebhookPayload {
    const levels: Record<string, 'high' | 'medium' | 'low'> = {
      explosion: 'high', risk: 'high', cross_platform: 'high',
      finance: 'medium', ai: 'medium',
    };
    const actions: Record<string, string> = {
      explosion: 'agent_analyze_topic',
      cross_platform: 'agent_analyze_topic',
      finance: 'agent_analyze_finance',
      ai: 'agent_analyze_ai_trend',
      risk: 'agent_alert_risk',
    };

    return {
      event,
      event_id: `evt_${signal.type}_${signal.id}`,
      created_at: signal.triggeredAt,
      source: 'webhot',
      level: levels[signal.type] || 'medium',
      topic: { id: signal.topicId, title: signal.title, category: signal.type },
      summary: signal.description,
      reason: `${signal.type} signal detected with score ${signal.score.toFixed(1)}`,
      recommended_action: actions[signal.type] || 'agent_analyze_topic',
      links: {
        mcp_tool: `webhot.get_topic_timeline`,
        api: `/api/v1/timeline/${signal.topicId}`,
      },
      signal,
    };
  }

  /** 主循环：轮询新 Signal 并分发 */
  async dispatch(): Promise<void> {
    const signals = this.signalRepo.findRecent(50);

    for (const signal of signals) {
      if (this.dispatchedSignals.has(signal.id)) continue;
      this.dispatchedSignals.add(signal.id);

      // 映射 Signal type 到 Webhook event 名称
      const eventMapping: Record<string, string> = {
        explosion: 'topic.exploding',
        cross_platform: 'topic.cross_platform',
        finance: 'signal.finance',
        ai: 'signal.ai',
        risk: 'signal.risk',
      };
      const event = eventMapping[signal.type] || 'signal.created';

      // 找到订阅此事件的 endpoint
      const subscribers = this.endpoints.filter(ep => ep.events.includes(event) || ep.events.includes('*'));
      if (subscribers.length === 0) continue;

      const payload = this.buildPayload(signal, event);
      const body = JSON.stringify(payload);

      for (const ep of subscribers) {
        await this._send(ep, body, payload);
      }
    }
  }

  /** 发送单个 Webhook */
  private async _send(ep: WebhookEndpoint, body: string, payload: WebhookPayload): Promise<void> {
    const signature = signPayload(ep.secret, body);

    try {
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WebHot-Signature': `sha256=${signature}`,
          'X-WebHot-Event': payload.event,
          'X-WebHot-Event-Id': payload.event_id,
        },
        body,
        signal: AbortSignal.timeout(ep.timeoutMs || 10000),
      });

      if (!res.ok && res.status >= 500) {
        this._enqueueRetry(ep, payload, 0, ep.retryMax);
      }
    } catch {
      this._enqueueRetry(ep, payload, 0, ep.retryMax);
    }
  }

  /** 重试队列 */
  private _enqueueRetry(ep: WebhookEndpoint, payload: WebhookPayload, attempt: number, maxRetry: number): void {
    if (attempt >= maxRetry) {
      console.error(`[webhook] max retries exceeded for ${payload.event_id} -> ${ep.url}`);
      return;
    }
    const key = `${payload.event_id}:${ep.id}`;
    this.retryQueue.set(key, { attempt, maxRetry, payload, endpoint: ep });
  }

  /** 处理重试队列 */
  async processRetries(): Promise<void> {
    const delays = [60_000, 300_000, 900_000, 3600_000]; // 1min, 5min, 15min, 1h

    const entries = Array.from(this.retryQueue.entries());
    this.retryQueue.clear();

    for (const [key, item] of entries) {
      const delay = delays[item.attempt] || 300_000;
      console.log(`[webhook] retrying ${item.payload.event_id} (attempt ${item.attempt + 1}) in ${delay / 1000}s`);

      setTimeout(async () => {
        const body = JSON.stringify(item.payload);
        const ok = await this._send(item.endpoint, body, item.payload);
      }, delay);

      // 放入下一轮重试
      const nextKey = `${item.payload.event_id}:${item.endpoint.id}:${item.attempt + 1}`;
      this.retryQueue.set(nextKey, { ...item, attempt: item.attempt + 1 });
    }
  }
}

// --- 加载 Webhook 配置 ---

function loadWebhookConfig(): WebhookEndpoint[] {
  const configPath = process.env.WEBHOOK_CONFIG_PATH ||
    resolve(__dirname, '../../../configs/webhooks.yaml');
  try {
    const raw = readFileSync(configPath, 'utf-8');
    const config = YAML.parse(raw) as { webhooks: WebhookEndpoint[] };
    return config.webhooks || [];
  } catch {
    console.warn('[webhook-worker] no webhooks config found, using empty');
    return [];
  }
}

// --- 主入口 ---

async function main() {
  console.log('[webhook-worker] starting...');

  const webhooks = loadWebhookConfig();
  console.log(`[webhook-worker] loaded ${webhooks.length} webhook endpoints`);

  const dispatcher = new WebhookDispatcher(webhooks);

  // 每 30 秒轮询新 Signal 并分发
  const pollInterval = setInterval(async () => {
    await dispatcher.dispatch();
    await dispatcher.processRetries();
  }, 30_000);

  process.on('SIGINT', () => { clearInterval(pollInterval); process.exit(0); });
  process.on('SIGTERM', () => { clearInterval(pollInterval); process.exit(0); });

  console.log('[webhook-worker] dispatcher running (30s interval)');
}

main().catch(err => {
  console.error('[webhook-worker] fatal:', err);
  process.exit(1);
});
