import { Model } from '@nozbe/watermelondb';
import { field, text, relation } from '@nozbe/watermelondb/decorators';

export default class Property extends Model {
  static table = 'properties';
  static associations = {
    customers: { type: 'belongs_to' as const, key: 'customer_id' },
  };

  @text('server_id') serverId!: string;
  @text('customer_id') customerId!: string;
  @text('name') name!: string;
  @field('is_primary') isPrimary!: boolean;
  @text('street') street!: string;
  @text('city') city!: string;
  @text('state') state!: string;
  @text('zip') zip!: string;
  @field('lat') lat!: number | null;
  @field('lng') lng!: number | null;
  @text('access_notes') accessNotes!: string | null;
  @text('service_notes') serviceNotes!: string | null;

  @relation('customers', 'customer_id') customer!: any;
}
