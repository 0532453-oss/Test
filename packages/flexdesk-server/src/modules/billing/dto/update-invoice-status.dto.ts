import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateInvoiceStatusDto {
  @ApiProperty({ enum: InvoiceStatus, description: 'New invoice status' })
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;
}
