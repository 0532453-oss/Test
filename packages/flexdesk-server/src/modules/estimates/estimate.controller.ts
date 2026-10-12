import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { type Estimate, EstimateStatus } from '@prisma/client';

import { type ConvertToJobDto } from './dto/convert-to-job.dto';
import { type CreateEstimateDto } from './dto/create-estimate.dto';
import { type UpdateEstimateDto } from './dto/update-estimate.dto';
import { EstimateService } from './estimate.service';

@ApiTags('estimates')
@ApiBearerAuth()
@Controller('estimates')
export class EstimateController {
  constructor(private readonly estimateService: EstimateService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new estimate/quote' })
  @ApiResponse({ status: 201, description: 'Estimate created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async create(@Body() dto: CreateEstimateDto): Promise<Estimate> {
    return this.estimateService.create({
      customerId: dto.customerId,
      title: dto.title,
      description: dto.description,
      lineItems: dto.lineItems,
      discount: dto.discount,
      taxRate: dto.taxRate,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      estimatedDuration: dto.estimatedDuration,
      location: dto.location,
      priority: dto.priority,
      customerNotes: dto.customerNotes,
      notes: dto.notes,
      terms: dto.terms,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all estimates' })
  @ApiQuery({ name: 'status', required: false, enum: EstimateStatus })
  @ApiResponse({ status: 200, description: 'List of estimates' })
  async findAll(
    @Query('status') status?: EstimateStatus,
  ): Promise<Estimate[]> {
    return this.estimateService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get estimate by ID' })
  @ApiParam({ name: 'id', description: 'Estimate UUID' })
  @ApiResponse({ status: 200, description: 'Estimate found' })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Estimate> {
    return this.estimateService.findById(id);
  }

  @Get('by-customer/:customerId')
  @ApiOperation({ summary: 'Get estimates by customer' })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Customer estimates' })
  async findByCustomer(
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ): Promise<Estimate[]> {
    return this.estimateService.findByCustomer(customerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update estimate (draft only)' })
  @ApiParam({ name: 'id', description: 'Estimate UUID' })
  @ApiResponse({ status: 200, description: 'Estimate updated' })
  @ApiResponse({ status: 400, description: 'Cannot modify non-draft estimate' })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEstimateDto,
  ): Promise<Estimate> {
    return this.estimateService.update(id, {
      title: dto.title,
      description: dto.description,
      lineItems: dto.lineItems,
      discount: dto.discount,
      taxRate: dto.taxRate,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      estimatedDuration: dto.estimatedDuration,
      location: dto.location,
      priority: dto.priority,
      customerNotes: dto.customerNotes,
      notes: dto.notes,
      terms: dto.terms,
    });
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send estimate to customer' })
  @ApiParam({ name: 'id', description: 'Estimate UUID' })
  @ApiResponse({ status: 200, description: 'Estimate sent' })
  @ApiResponse({ status: 400, description: 'Only draft estimates can be sent' })
  async send(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Estimate> {
    return this.estimateService.send(id);
  }

  @Post(':id/mark-viewed')
  @ApiOperation({ summary: 'Mark estimate as viewed by customer' })
  @ApiParam({ name: 'id', description: 'Estimate UUID' })
  @ApiResponse({ status: 200, description: 'Estimate marked as viewed' })
  @ApiResponse({ status: 400, description: 'Only sent estimates can be marked as viewed' })
  async markViewed(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Estimate> {
    return this.estimateService.markViewed(id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept estimate (customer action)' })
  @ApiParam({ name: 'id', description: 'Estimate UUID' })
  @ApiResponse({ status: 200, description: 'Estimate accepted' })
  @ApiResponse({ status: 400, description: 'Only sent/viewed estimates can be accepted' })
  async accept(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Estimate> {
    return this.estimateService.accept(id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject estimate (customer action)' })
  @ApiParam({ name: 'id', description: 'Estimate UUID' })
  @ApiResponse({ status: 200, description: 'Estimate rejected' })
  @ApiResponse({ status: 400, description: 'Only sent/viewed estimates can be rejected' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Estimate> {
    return this.estimateService.reject(id);
  }

  @Post(':id/convert-to-job')
  @ApiOperation({ summary: 'Convert accepted estimate to a job' })
  @ApiParam({ name: 'id', description: 'Estimate UUID' })
  @ApiResponse({ status: 200, description: 'Estimate converted to job' })
  @ApiResponse({ status: 400, description: 'Only accepted estimates can be converted' })
  async convertToJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertToJobDto,
  ): Promise<Estimate> {
    return this.estimateService.convertToJob(id, {
      technicianId: dto.technicianId,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete estimate (draft only)' })
  @ApiParam({ name: 'id', description: 'Estimate UUID' })
  @ApiResponse({ status: 204, description: 'Estimate deleted' })
  @ApiResponse({ status: 400, description: 'Only draft estimates can be deleted' })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.estimateService.delete(id);
  }

  @Post('check-expired')
  @ApiOperation({ summary: 'Check and mark expired estimates' })
  @ApiResponse({ status: 200, description: 'Number of estimates marked as expired' })
  async checkExpired(): Promise<{ expiredCount: number }> {
    const count = await this.estimateService.checkExpiredEstimates();
    return { expiredCount: count };
  }
}
