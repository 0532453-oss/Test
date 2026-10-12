import { Model } from '@nozbe/watermelondb';
import { field, text, readonly, date } from '@nozbe/watermelondb/decorators';

export default class SyncQueueItem extends Model {
  static table = 'sync_queue';

  @text('endpoint') endpoint!: string;
  @text('method') method!: string;
  @text('payload') payload!: string;
  @text('entity_type') entityType!: string;
  @text('entity_id') entityId!: string;
  @text('status') status!: string;
  @field('retry_count') retryCount!: number;
  @readonly @date('created_at') createdAt!: Date;
}
