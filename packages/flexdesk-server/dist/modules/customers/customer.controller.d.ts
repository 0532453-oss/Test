import { type Customer } from '@prisma/client';
import { type CustomerService } from './customer.service';
import { type CreateCustomerDto } from './dto/create-customer.dto';
import { type UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomerController {
    private readonly customerService;
    constructor(customerService: CustomerService);
    create(dto: CreateCustomerDto): Promise<Customer>;
    findAll(search?: string): Promise<Customer[]>;
    findOne(id: string): Promise<Customer>;
    getWithJobs(id: string): Promise<Customer & {
        jobs: any[];
    }>;
    update(id: string, dto: UpdateCustomerDto): Promise<Customer>;
    delete(id: string): Promise<Customer>;
}
