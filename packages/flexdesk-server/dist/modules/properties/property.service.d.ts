import { type Property, type Prisma } from '@prisma/client';
import { type CreatePropertyDto } from './dto/create-property.dto';
import { type UpdatePropertyDto } from './dto/update-property.dto';
import { type PrismaService } from '@/core/database/prisma.service';
import { BaseService } from '@/engine/base.service';
export declare class PropertyService extends BaseService<Prisma.PropertyDelegate> {
    constructor(prisma: PrismaService);
    createProperty(dto: CreatePropertyDto): Promise<Property>;
    findAllProperties(): Promise<Property[]>;
    findPropertiesByCustomer(customerId: string): Promise<Property[]>;
    findPropertyById(id: string): Promise<Property>;
    getPrimaryProperty(customerId: string): Promise<Property | null>;
    updateProperty(id: string, dto: UpdatePropertyDto): Promise<Property>;
    setPrimaryProperty(id: string): Promise<Property>;
    deleteProperty(id: string): Promise<Property>;
    searchProperties(query: string): Promise<Property[]>;
    getPropertyWithRelations(id: string): Promise<Property & {
        customer: any;
        jobs: any[];
    }>;
    migrateCustomerAddressToProperty(customerId: string, propertyName?: string): Promise<Property | null>;
}
