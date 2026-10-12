import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export default class Part extends Model {
  static table = 'parts';

  @text('server_id') serverId!: string;
  @text('sku') sku!: string;
  @text('name') name!: string;
  @text('category') category!: string | null;
  @field('unit_cost') unitCost!: number;
  @field('unit_price') unitPrice!: number;
  @field('quantity_on_hand') quantityOnHand!: number;
}
