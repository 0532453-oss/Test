import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class CreateInvoiceDto {
  @ApiPropertyOptional({ description: 'Invoice due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Auto-send to customer' })
  @IsOptional()
  @IsBoolean()
  autoSend?: boolean;
}
