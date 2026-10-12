import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class BillingPortalDto {
  @ApiProperty({
    description: 'URL to redirect to after the billing portal session',
    example: 'https://app.flexdesk.io/settings/billing',
  })
  @IsUrl({ protocols: ['https'], require_tld: true })
  returnUrl: string;
}
