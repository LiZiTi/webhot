import { getDb } from '../db.js';
import type { TimelineEvent } from '@webhot/schemas';
import { v4 as uuid } from 'uuid';

export class TimelineRepo {
  insert(event: TimelineEvent & { topicId: string }): void {
    const db = getDb();
    db.prepare(`
      INSERT INTO timeline_events (id, topic_id, time, platform, source, title, url, summary, metrics)
      VALUES (@id, @topicId, @time, @platform, @source, @title, @url, @summary, @metrics)
    `).run({
      id: uuid(),
      topicId: event.topicId,
      time: event.time,
      platform: event.platform,
      source: event.source,
      title: event.title,
      url: event.url || null,
      summary: event.summary || null,
      metrics: event.metrics ? JSON.stringify(event.metrics) : null,
    });
  }

  insertMany(events: Array<TimelineEvent & { topicId: string }>): void {
    const db = getDb();
    const insert = db.prepare(`
      INSERT INTO timeline_events (id, topic_id, time, platform, source, title, url, summary, metrics)
      VALUES (@id, @topicId, @time, @platform, @source, @title, @url, @summary, @metrics)
    `);
    db.transaction(() => {
      for (const e of events) {
        insert.run({
          id: uuid(),
          topicId: e.topicId,
          time: e.time,
          platform: e.platform,
          source: e.source,
          title: e.title,
          url: e.url || null,
          summary: e.summary || null,
          metrics: e.metrics ? JSON.stringify(e.metrics) : null,
        });
      }
    })();
  }

  findByTopic(topicId: string): TimelineEvent[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM timeline_events WHERE topic_id = ? ORDER BY time ASC'
    ).all(topicId) as Record<string, unknown>[];
    return rows.map(r => this._deserialize(r));
  }

  findRecent(limit: number = 50): TimelineEvent[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM timeline_events ORDER BY time DESC LIMIT ?'
    ).all(limit) as Record<string, unknown>[];
    return rows.map(r => this._deserialize(r));
  }

  private _deserialize(row: Record<string, unknown>): TimelineEvent {
    return {
      time: row.time as string,
      platform: row.platform as string,
      source: row.source as string,
      title: row.title as string,
      url: row.url as string | undefined,
      summary: row.summary as string | undefined,
      metrics: row.metrics ? JSON.parse(row.metrics as string) : undefined,
    };
  }
}
