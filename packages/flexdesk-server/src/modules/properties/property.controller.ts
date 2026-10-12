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

import { type CreatePropertyDto } from './dto/create-property.dto';
import { type UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyService } from './property.service';

@ApiTags('Properties')
@ApiBearerAuth()
@Controller('properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new property for a customer' })
  @ApiResponse({ status: 201, description: 'Property created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async create(@Body() dto: CreatePropertyDto) {
    return this.propertyService.createProperty(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all properties in the workspace' })
  @ApiResponse({ status: 200, description: 'List of properties' })
  async findAll() {
    return this.propertyService.findAllProperties();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search properties by name or address' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(@Query('q') query: string) {
    return this.propertyService.searchProperties(query);
  }

  @Get('by-customer/:customerId')
  @ApiOperation({ summary: 'Get all properties for a specific customer' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'List of customer properties' })
  async findByCustomer(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.propertyService.findPropertiesByCustomer(customerId);
  }

  @Get('by-customer/:customerId/primary')
  @ApiOperation({ summary: 'Get the primary property for a customer' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Primary property or null' })
  async getPrimaryForCustomer(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.propertyService.getPrimaryProperty(customerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a property by ID' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Property details' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertyService.findPropertyById(id);
  }

  @Get(':id/with-relations')
  @ApiOperation({ summary: 'Get property with customer and jobs information' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Property with relations' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async findOneWithRelations(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertyService.getPropertyWithRelations(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a property' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Property updated successfully' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePropertyDto) {
    return this.propertyService.updateProperty(id, dto);
  }

  @Post(':id/set-primary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a property as the primary location for its customer' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Property set as primary' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async setPrimary(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertyService.setPrimaryProperty(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a property' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Property deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete: property is in use' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertyService.deleteProperty(id);
  }

  @Post('migrate/:customerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Migrate a customer legacy address to a property record',
    description:
      'Creates a property from the customer legacy address JSON field. Returns null if no address exists or property already migrated.',
  })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiQuery({ name: 'name', description: 'Property name', required: false })
  @ApiResponse({ status: 200, description: 'Migration result' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async migrateCustomerAddress(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Query('name') name?: string,
  ) {
    return this.propertyService.migrateCustomerAddressToProperty(
      customerId,
      name || 'Primary',
    );
  }
}
