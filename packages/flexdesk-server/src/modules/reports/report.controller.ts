import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';

import {
  type ReportService,
  type RevenueReportSummary,
  type TechnicianPerformanceSummary,
  type CustomerAnalyticsSummary,
  type DashboardSummary,
} from './report.service';

@ApiTags('reports')
@ApiBearerAuth()
@Roles('OWNER', 'ADMIN')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard summary with key metrics' })
  @ApiQuery({ name: 'startDate', required: true, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2024-12-31' })
  async getDashboardSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<DashboardSummary> {
    this.validateRequiredDateParams(startDate, endDate);
    const dateRange = this.reportService.validateDateRange(startDate, endDate);
    return this.reportService.getDashboardSummary(dateRange);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue report with breakdown by month and service type' })
  @ApiQuery({ name: 'startDate', required: true, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2024-12-31' })
  async getRevenueReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<RevenueReportSummary> {
    this.validateRequiredDateParams(startDate, endDate);
    const dateRange = this.reportService.validateDateRange(startDate, endDate);
    return this.reportService.getRevenueReport(dateRange);
  }

  @Get('technician-performance')
  @ApiOperation({ summary: 'Get technician performance report with metrics per technician' })
  @ApiQuery({ name: 'startDate', required: true, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2024-12-31' })
  async getTechnicianPerformanceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<TechnicianPerformanceSummary> {
    this.validateRequiredDateParams(startDate, endDate);
    const dateRange = this.reportService.validateDateRange(startDate, endDate);
    return this.reportService.getTechnicianPerformanceReport(dateRange);
  }

  @Get('customer-analytics')
  @ApiOperation({ summary: 'Get customer analytics with metrics and trends' })
  @ApiQuery({ name: 'startDate', required: true, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2024-12-31' })
  async getCustomerAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<CustomerAnalyticsSummary> {
    this.validateRequiredDateParams(startDate, endDate);
    const dateRange = this.reportService.validateDateRange(startDate, endDate);
    return this.reportService.getCustomerAnalytics(dateRange);
  }

  private validateRequiredDateParams(startDate: string, endDate: string): void {
    if (!startDate) {
      throw new BadRequestException('startDate query parameter is required');
    }
    if (!endDate) {
      throw new BadRequestException('endDate query parameter is required');
    }
  }
}
