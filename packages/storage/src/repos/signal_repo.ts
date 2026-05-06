import { getDb } from '../db.js';
import type { Signal } from '@webhot/schemas';
import { v4 as uuid } from 'uuid';

export class SignalRepo {
  insert(signal: Signal): void {
    const db = getDb();
    const id = typeof signal.id === 'string' && signal.id.trim().length > 0 ? signal.id : uuid();
    db.prepare(`
      INSERT INTO signals (id, type, topic_id, title, score, description, platforms, triggered_at)
      VALUES (@id, @type, @topicId, @title, @score, @description, @platforms, @triggeredAt)
    `).run({
      id,
      type: signal.type,
      topicId: signal.topicId,
      title: signal.title,
      score: signal.score,
      description: signal.description,
      platforms: JSON.stringify(signal.platforms),
      triggeredAt: signal.triggeredAt,
    });
  }

  findByType(type: string, limit: number = 20): Signal[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM signals WHERE type = ? ORDER BY triggered_at DESC LIMIT ?'
    ).all(type, limit) as Record<string, unknown>[];
    return rows.map(r => this._deserialize(r));
  }

  findRecent(limit: number = 30): Signal[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM signals ORDER BY triggered_at DESC LIMIT ?'
    ).all(limit) as Record<string, unknown>[];
    return rows.map(r => this._deserialize(r));
  }

  findByTopic(topicId: string): Signal[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM signals WHERE topic_id = ? ORDER BY triggered_at DESC'
    ).all(topicId) as Record<string, unknown>[];
    return rows.map(r => this._deserialize(r));
  }

  private _deserialize(row: Record<string, unknown>): Signal {
    return {
      id: row.id as string,
      type: row.type as Signal['type'],
      topicId: row.topic_id as string,
      title: row.title as string,
      score: row.score as number,
      description: row.description as string,
      platforms: JSON.parse(row.platforms as string),
      triggeredAt: row.triggered_at as string,
    };
  }
}
