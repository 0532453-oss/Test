import { type Customer, Prisma } from '@prisma/client';
import { type CreateCustomerDto } from './dto/create-customer.dto';
import { type UpdateCustomerDto } from './dto/update-customer.dto';
import { type PrismaService } from '@/core/database/prisma.service';
import { BaseService } from '@/engine/base.service';
export declare class CustomerService extends BaseService<Prisma.CustomerDelegate> {
    constructor(prisma: PrismaService);
    createCustomer(dto: CreateCustomerDto): Promise<Customer>;
    findAllCustomers(): Promise<Customer[]>;
    findCustomerById(id: string): Promise<Customer>;
    updateCustomer(id: string, dto: UpdateCustomerDto): Promise<Customer>;
    deleteCustomer(id: string): Promise<Customer>;
    searchCustomers(query: string): Promise<Customer[]>;
    getCustomerWithJobs(id: string): Promise<Customer & {
        jobs: any[];
    }>;
}
