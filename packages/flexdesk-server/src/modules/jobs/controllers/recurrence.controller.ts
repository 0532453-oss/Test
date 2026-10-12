import {
  Body,
  Controller,
  Param,
  Post,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  type RecurringJobTemplate,
  type Job,
} from '@prisma/client';

import { type CreateTemplateDto } from '../dto/recurrence.dto';
import { RecurrenceService } from '../recurrence.service';

@Controller('recurring-templates')
export class RecurrenceController {
  constructor(private readonly recurrenceService: RecurrenceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTemplate(
    @Body() createTemplateDto: CreateTemplateDto,
  ): Promise<RecurringJobTemplate> {
    return await this.recurrenceService.createTemplate(createTemplateDto);
  }

  @Post('process-all')
  @HttpCode(HttpStatus.OK)
  async processAllRecurringJobs(): Promise<{
    generated: number;
    skipped: number;
    errors: Array<{ templateId: string; error: string }>;
  }> {
    return await this.recurrenceService.generateRecurringJobs();
  }

  @Post(':id/generate')
  @HttpCode(HttpStatus.OK)
  async generateJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body?: { targetDate?: string },
  ): Promise<Job> {
    const targetDate = body?.targetDate
      ? new Date(body.targetDate)
      : new Date();

    return await this.recurrenceService.generateJobFromTemplate(id, targetDate);
  }
}
