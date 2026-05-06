import { getDb } from '../db.js';
import { v4 as uuid } from 'uuid';

export interface WorldChange {
  id: string;
  topicId?: string;
  changeType: 'new_hot' | 'heat_surge' | 'cross_platform' | 'trend_start' | 'trend_peak' | 'trend_decay' | 'finance_link' | 'ai_link';
  title: string;
  fromValue?: number;
  toValue?: number;
  platforms: string[];
  recordedAt: string;
  metadata?: Record<string, unknown>;
}

export class ChangeRepo {
  insert(change: WorldChange): void {
    const db = getDb();
    db.prepare(`
      INSERT INTO world_changes (id, topic_id, change_type, title, from_value, to_value, platforms, recorded_at, metadata)
      VALUES (@id, @topicId, @changeType, @title, @fromValue, @toValue, @platforms, @recordedAt, @metadata)
    `).run({
      id: change.id || uuid(),
      topicId: change.topicId || null,
      changeType: change.changeType,
      title: change.title,
      fromValue: change.fromValue ?? null,
      toValue: change.toValue ?? null,
      platforms: JSON.stringify(change.platforms),
      recordedAt: change.recordedAt,
      metadata: change.metadata ? JSON.stringify(change.metadata) : null,
    });
  }

  findByTopic(topicId: string): WorldChange[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM world_changes WHERE topic_id = ? ORDER BY recorded_at ASC'
    ).all(topicId) as Record<string, unknown>[];
    return rows.map(r => this._deserialize(r));
  }

  findByType(changeType: string, limit: number = 20): WorldChange[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM world_changes WHERE change_type = ? ORDER BY recorded_at DESC LIMIT ?'
    ).all(changeType, limit) as Record<string, unknown>[];
    return rows.map(r => this._deserialize(r));
  }

  findRecent(limit: number = 50): WorldChange[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM world_changes ORDER BY recorded_at DESC LIMIT ?'
    ).all(limit) as Record<string, unknown>[];
    return rows.map(r => this._deserialize(r));
  }

  private _deserialize(row: Record<string, unknown>): WorldChange {
    return {
      id: row.id as string,
      topicId: row.topic_id as string | undefined,
      changeType: row.change_type as WorldChange['changeType'],
      title: row.title as string,
      fromValue: row.from_value as number | undefined,
      toValue: row.to_value as number | undefined,
      platforms: JSON.parse(row.platforms as string),
      recordedAt: row.recorded_at as string,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
    };
  }
}
