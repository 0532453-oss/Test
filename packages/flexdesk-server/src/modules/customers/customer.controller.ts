import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
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
import { type Customer } from '@prisma/client';

import { CustomerService } from './customer.service';
import { type CreateCustomerDto } from './dto/create-customer.dto';
import { type UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() dto: CreateCustomerDto): Promise<Customer> {
    return this.customerService.createCustomer(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'List of customers' })
  @ApiQuery({ name: 'search', required: false, description: 'Search query' })
  async findAll(@Query('search') search?: string): Promise<Customer[]> {
    if (search) {
      return this.customerService.searchCustomers(search);
    }
    return this.customerService.findAllCustomers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Customer found' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Customer> {
    return this.customerService.findCustomerById(id);
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get customer with recent jobs' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Customer with jobs' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getWithJobs(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Customer & { jobs: any[] }> {
    return this.customerService.getCustomerWithJobs(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Customer updated' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customerService.updateCustomer(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a customer' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Customer deleted' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Customer> {
    return this.customerService.deleteCustomer(id);
  }
}
