import { Model } from '@nozbe/watermelondb';
import { field, text, date, relation } from '@nozbe/watermelondb/decorators';

export default class Invoice extends Model {
  static table = 'invoices';
  static associations = {
    customers: { type: 'belongs_to' as const, key: 'customer_id' },
  };

  @text('server_id') serverId!: string;
  @text('job_id') jobId!: string;
  @text('customer_id') customerId!: string;
  @text('invoice_number') invoiceNumber!: string;
  @text('status') status!: string;
  @field('amount') amount!: number;
  @field('tax') tax!: number;
  @field('total') total!: number;
  @field('due_date') dueDate!: number | null;
  @field('paid_at') paidAt!: number | null;
  @field('sync_version') syncVersion!: number;

  @relation('customers', 'customer_id') customer!: any;
}
