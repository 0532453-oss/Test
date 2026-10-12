import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, relation } from '@nozbe/watermelondb/decorators';

export default class Job extends Model {
  static table = 'jobs';
  static associations = {
    customers: { type: 'belongs_to' as const, key: 'customer_id' },
    properties: { type: 'belongs_to' as const, key: 'property_id' },
  };

  @text('server_id') serverId!: string;
  @text('workspace_id') workspaceId!: string;
  @text('customer_id') customerId!: string;
  @text('technician_id') technicianId!: string;
  @text('property_id') propertyId!: string | null;
  @text('title') title!: string;
  @text('description') description!: string | null;
  @text('status') status!: string;
  @text('priority') priority!: string;
  @text('scheduled_date') scheduledDate!: string | null;
  @text('scheduled_start_time') scheduledStartTime!: string | null;
  @text('scheduled_end_time') scheduledEndTime!: string | null;
  @field('location_lat') locationLat!: number | null;
  @field('location_lng') locationLng!: number | null;
  @field('estimated_duration') estimatedDuration!: number | null;
  @field('sync_version') syncVersion!: number;
  @field('last_synced_at') lastSyncedAt!: number | null;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('customers', 'customer_id') customer!: any;
  @relation('properties', 'property_id') property!: any;
}
