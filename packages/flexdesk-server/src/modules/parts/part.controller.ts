import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { type AddJobPartDto } from './dto/add-job-part.dto';
import { type AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { type CreatePartDto } from './dto/create-part.dto';
import { type UpdateJobPartDto } from './dto/update-job-part.dto';
import { type UpdatePartDto } from './dto/update-part.dto';
import { PartService } from './part.service';

@ApiTags('Parts')
@ApiBearerAuth()
@Controller('parts')
export class PartController {
  constructor(private readonly partService: PartService) {}

  // =========== Part CRUD ===========

  @Post()
  @ApiOperation({ summary: 'Create a new part' })
  @ApiResponse({ status: 201, description: 'Part created successfully' })
  @ApiResponse({ status: 409, description: 'SKU already exists' })
  async createPart(@Body() dto: CreatePartDto) {
    return this.partService.createPart(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all parts' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'lowStock', required: false, description: 'Only show low stock parts' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, SKU, or description' })
  @ApiResponse({ status: 200, description: 'List of parts' })
  async listParts(
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
    @Query('lowStock') lowStock?: string,
    @Query('search') search?: string,
  ) {
    return this.partService.listParts({
      category,
      isActive: isActive ? isActive === 'true' : undefined,
      lowStock: lowStock === 'true',
      search,
    });
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get parts with low stock (below reorder point)' })
  @ApiResponse({ status: 200, description: 'List of low stock parts' })
  async getLowStockParts() {
    return this.partService.getLowStockParts();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all part categories in workspace' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async getCategories() {
    return this.partService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a part by ID' })
  @ApiParam({ name: 'id', description: 'Part ID' })
  @ApiResponse({ status: 200, description: 'Part details' })
  @ApiResponse({ status: 404, description: 'Part not found' })
  async getPart(@Param('id', ParseUUIDPipe) id: string) {
    return this.partService.getPartById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a part' })
  @ApiParam({ name: 'id', description: 'Part ID' })
  @ApiResponse({ status: 200, description: 'Part updated successfully' })
  @ApiResponse({ status: 404, description: 'Part not found' })
  @ApiResponse({ status: 409, description: 'SKU already exists' })
  async updatePart(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePartDto) {
    return this.partService.updatePart(id, dto);
  }

  @Patch(':id/inventory')
  @ApiOperation({ summary: 'Adjust part inventory quantity' })
  @ApiParam({ name: 'id', description: 'Part ID' })
  @ApiResponse({ status: 200, description: 'Inventory adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Adjustment would result in negative inventory' })
  @ApiResponse({ status: 404, description: 'Part not found' })
  async adjustInventory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjustInventoryDto,
  ) {
    return this.partService.adjustInventory(id, dto.adjustment, dto.reason);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a part (soft delete if used in jobs)' })
  @ApiParam({ name: 'id', description: 'Part ID' })
  @ApiResponse({ status: 200, description: 'Part deleted successfully' })
  @ApiResponse({ status: 404, description: 'Part not found' })
  async deletePart(@Param('id', ParseUUIDPipe) id: string) {
    return this.partService.deletePart(id);
  }
}

@ApiTags('Job Parts')
@ApiBearerAuth()
@Controller('jobs/:jobId/parts')
export class JobPartController {
  constructor(private readonly partService: PartService) {}

  @Get()
  @ApiOperation({ summary: 'Get all parts for a job' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'List of job parts' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobParts(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.partService.getJobParts(jobId);
  }

  @Get('totals')
  @ApiOperation({ summary: 'Get total cost and price for job parts' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiResponse({
    status: 200,
    description: 'Job parts totals',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        partsCount: { type: 'number' },
        totalCost: { type: 'number' },
        totalPrice: { type: 'number' },
        profit: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobPartsTotals(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.partService.getJobPartsTotals(jobId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a part to a job' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiResponse({ status: 201, description: 'Part added to job' })
  @ApiResponse({ status: 400, description: 'Insufficient inventory or inactive part' })
  @ApiResponse({ status: 404, description: 'Job or part not found' })
  @ApiResponse({ status: 409, description: 'Part already added to job' })
  async addPartToJob(@Param('jobId', ParseUUIDPipe) jobId: string, @Body() dto: AddJobPartDto) {
    return this.partService.addPartToJob(jobId, dto);
  }

  @Patch(':jobPartId')
  @ApiOperation({ summary: 'Update a job part' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiParam({ name: 'jobPartId', description: 'Job Part ID' })
  @ApiResponse({ status: 200, description: 'Job part updated' })
  @ApiResponse({ status: 400, description: 'Insufficient inventory for quantity increase' })
  @ApiResponse({ status: 404, description: 'Job part not found' })
  async updateJobPart(
    @Param('jobPartId', ParseUUIDPipe) jobPartId: string,
    @Body() dto: UpdateJobPartDto,
  ) {
    return this.partService.updateJobPart(jobPartId, dto);
  }

  @Delete(':jobPartId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a part from a job (returns inventory)' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiParam({ name: 'jobPartId', description: 'Job Part ID' })
  @ApiResponse({ status: 200, description: 'Part removed from job' })
  @ApiResponse({ status: 404, description: 'Job part not found' })
  async removePartFromJob(@Param('jobPartId', ParseUUIDPipe) jobPartId: string) {
    return this.partService.removePartFromJob(jobPartId);
  }
}
