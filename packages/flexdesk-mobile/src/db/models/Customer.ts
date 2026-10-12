import { Model } from '@nozbe/watermelondb';
import { field, text, children } from '@nozbe/watermelondb/decorators';

export default class Customer extends Model {
  static table = 'customers';
  static associations = {
    jobs: { type: 'has_many' as const, foreignKey: 'customer_id' },
    invoices: { type: 'has_many' as const, foreignKey: 'customer_id' },
    properties: { type: 'has_many' as const, foreignKey: 'customer_id' },
  };

  @text('server_id') serverId!: string;
  @text('name') name!: string;
  @text('email') email!: string | null;
  @text('phone') phone!: string | null;
  @field('sync_version') syncVersion!: number;
  @field('last_synced_at') lastSyncedAt!: number | null;

  @children('jobs') jobs!: any;
  @children('invoices') invoices!: any;
  @children('properties') properties!: any;
}
