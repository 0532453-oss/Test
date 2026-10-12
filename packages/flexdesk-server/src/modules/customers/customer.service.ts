import { Injectable, NotFoundException } from '@nestjs/common';
import { type Customer, Prisma, SyncStatus } from '@prisma/client';

import { type CreateCustomerDto } from './dto/create-customer.dto';
import { type UpdateCustomerDto } from './dto/update-customer.dto';

import { PrismaService } from '@/core/database/prisma.service';
import { BaseService } from '@/engine/base.service';

@Injectable()
export class CustomerService extends BaseService<Prisma.CustomerDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.customer, 'Customer');
  }

  async createCustomer(dto: CreateCustomerDto): Promise<Customer> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const data: Prisma.CustomerCreateInput = {
      workspace: { connect: { id: workspaceId } },
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      address: dto.address as Prisma.InputJsonValue | undefined,
      syncStatus: SyncStatus.PENDING,
      syncVersion: 0,
    };

    const customer = await this.create({ data });
    return customer as Customer;
  }

  async findAllCustomers(): Promise<Customer[]> {
    const customers = await this.findMany({
      orderBy: { name: 'asc' },
    });
    return customers as Customer[];
  }

  async findCustomerById(id: string): Promise<Customer> {
    const customer = await this.findUniqueOrThrow({ where: { id } });
    return customer as Customer;
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const existing = await this.findCustomerById(id);

    const data: Prisma.CustomerUpdateInput = {
      ...(dto.name && { name: dto.name }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.address !== undefined && {
        address: dto.address === null ? Prisma.JsonNull : (dto.address as Prisma.InputJsonValue),
      }),
      syncStatus: SyncStatus.PENDING,
      syncVersion: existing.syncVersion + 1,
    };

    const customer = await this.update({
      where: { id },
      data,
    });

    return customer as Customer;
  }

  async deleteCustomer(id: string): Promise<Customer> {
    await this.findCustomerById(id);

    const customer = await this.delete({ where: { id } });
    return customer as Customer;
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const customers = await this.prisma.customer.findMany({
      where: {
        workspaceId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
      take: 20,
    });

    return customers;
  }

  async getCustomerWithJobs(id: string): Promise<Customer & { jobs: any[] }> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const customer = await this.prisma.customer.findFirst({
      where: { id, workspaceId },
      include: {
        jobs: {
          orderBy: { scheduledAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }
}
