import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { type Technician } from '@prisma/client';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { type CreateTechnicianDto } from '../dto/create-technician.dto';
import {
  NextJobResponseDto,
  type NoNextJobResponseDto,
} from '../dto/next-job-response.dto';
import { type ToggleAvailabilityDto } from '../dto/toggle-availability.dto';
import { type UpdateLocationDto } from '../dto/update-location.dto';
import { type UpdateTechnicianDto } from '../dto/update-technician.dto';
import { TechnicianService } from '../technician.service';

@ApiTags('technicians')
@ApiBearerAuth()
@Controller('technicians')
export class TechnicianController {
  constructor(private readonly technicianService: TechnicianService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new technician' })
  @ApiResponse({ status: 201, description: 'Technician created' })
  async create(@Body() dto: CreateTechnicianDto): Promise<Technician> {
    return this.technicianService.createTechnician(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all technicians' })
  @ApiResponse({ status: 200, description: 'List of technicians' })
  @ApiQuery({ name: 'available', required: false, type: Boolean })
  async findAll(
    @Query('available') available?: boolean,
  ): Promise<Technician[]> {
    if (available !== undefined) {
      return this.technicianService.findAvailableTechnicians(available);
    }
    return this.technicianService.findAllTechnicians();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current technician profile' })
  @ApiResponse({ status: 200, description: 'Current technician profile' })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  async getMyProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Technician> {
    return this.technicianService.findTechnicianByUserId(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a technician by ID' })
  @ApiParam({ name: 'id', description: 'Technician UUID' })
  @ApiResponse({ status: 200, description: 'Technician found' })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Technician> {
    return this.technicianService.findTechnicianById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a technician' })
  @ApiParam({ name: 'id', description: 'Technician UUID' })
  @ApiResponse({ status: 200, description: 'Technician updated' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTechnicianDto,
  ): Promise<Technician> {
    return this.technicianService.updateTechnician(id, dto);
  }

  @Patch('location')
  @ApiOperation({ summary: 'Update current technician location' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  async updateLocation(
    @Body() dto: UpdateLocationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.technicianService.updateCurrentLocation(user.id, dto);
  }

  @Patch(':id/availability')
  @ApiOperation({ summary: 'Toggle technician availability' })
  @ApiParam({ name: 'id', description: 'Technician UUID' })
  @ApiResponse({ status: 200, description: 'Availability updated' })
  async toggleAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ToggleAvailabilityDto,
  ): Promise<Technician> {
    return this.technicianService.setAvailability(id, dto.isAvailable);
  }

  @Get(':id/next-job')
  @ApiOperation({
    summary: 'Get next scheduled job for a technician',
    description:
      'Returns the next upcoming job with travel time estimation from Google Distance Matrix API',
  })
  @ApiParam({ name: 'id', description: 'Technician UUID' })
  @ApiResponse({
    status: 200,
    description: 'Next job details or no upcoming job message',
    type: NextJobResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  async getNextJob(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NextJobResponseDto | NoNextJobResponseDto> {
    return this.technicianService.getNextJob(id);
  }
}

