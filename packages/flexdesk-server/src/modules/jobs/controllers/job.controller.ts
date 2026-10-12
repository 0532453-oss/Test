import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
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
import { type Job, JobStatus } from '@prisma/client';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { type CreateJobDto, type DateRangeQueryDto } from '../dto/create-job.dto';
import { type UpdateJobStatusDto } from '../dto/update-job-status.dto';
import { type UpdateJobDto } from '../dto/update-job.dto';
import { JobService } from '../job.service';

@ApiTags('jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job' })
  @ApiResponse({ status: 201, description: 'Job created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() dto: CreateJobDto): Promise<Job> {
    return this.jobService.createJob(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all jobs' })
  @ApiQuery({ name: 'status', required: false, enum: JobStatus })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'technicianId', required: false })
  @ApiResponse({ status: 200, description: 'List of jobs' })
  async findAll(
    @Query('status') status?: JobStatus,
    @Query('customerId') customerId?: string,
    @Query('technicianId') technicianId?: string,
  ): Promise<Job[]> {
    return this.jobService.findAllJobs({ status, customerId, technicianId });
  }

  @Get('sync')
  @ApiOperation({ summary: 'Sync jobs for current technician' })
  @ApiQuery({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, description: 'Jobs for the specified date' })
  async syncJobs(
    @Query('date') date: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Job[]> {
    let targetDate: Date;

    if (!date) {
      targetDate = new Date();
    } else {
      const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateFormatRegex.test(date)) {
        throw new BadRequestException(
          'Invalid date format. Expected YYYY-MM-DD format (e.g., 2024-01-15).',
        );
      }

      const parts = date.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      const parsed = new Date(year, month, day);
      if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month ||
        parsed.getDate() !== day
      ) {
        throw new BadRequestException(
          'Invalid date. Please provide a valid date in YYYY-MM-DD format.',
        );
      }

      targetDate = parsed;
    }

    return this.jobService.findTechnicianJobsForDate(user.id, targetDate);
  }

  @Get('scheduled')
  @ApiOperation({ summary: 'Get jobs scheduled for a date range' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date YYYY-MM-DD' })
  @ApiResponse({ status: 200, description: 'Scheduled jobs' })
  async getScheduledJobs(
    @Query() dateRange: DateRangeQueryDto,
  ): Promise<Job[]> {
    return this.jobService.findJobsByDateRange(
      new Date(dateRange.startDate),
      new Date(dateRange.endDate),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a job by ID' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  @ApiResponse({ status: 200, description: 'Job found' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Job> {
    return this.jobService.getJobById(id);
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get job with all related data' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  @ApiResponse({ status: 200, description: 'Job with relations' })
  async getJobDetails(@Param('id', ParseUUIDPipe) id: string): Promise<Job> {
    return this.jobService.getJobWithDetails(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a job' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  @ApiResponse({ status: 200, description: 'Job updated' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobDto,
  ): Promise<Job> {
    return this.jobService.updateJob(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update job status' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateJobStatusDto,
  ): Promise<Job> {
    return this.jobService.transitionStatus(id, body.status);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign technician to job' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  @ApiResponse({ status: 200, description: 'Technician assigned' })
  async assignTechnician(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('technicianId', ParseUUIDPipe) technicianId: string,
  ): Promise<Job> {
    return this.jobService.assignTechnician(id, technicianId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a job' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  @ApiResponse({ status: 200, description: 'Job deleted' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<Job> {
    return this.jobService.deleteJob(id);
  }
}

