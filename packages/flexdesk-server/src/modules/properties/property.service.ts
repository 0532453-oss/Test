import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { type Property, type Prisma, SyncStatus } from '@prisma/client';

import { type CreatePropertyDto } from './dto/create-property.dto';
import { type UpdatePropertyDto } from './dto/update-property.dto';

import { PrismaService } from '@/core/database/prisma.service';
import { BaseService } from '@/engine/base.service';

@Injectable()
export class PropertyService extends BaseService<Prisma.PropertyDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.property, 'Property');
  }

  /**
   * Create a new property for a customer
   */
  async createProperty(dto: CreatePropertyDto): Promise<Property> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    // Verify the customer exists and belongs to this workspace
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, workspaceId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // If this is marked as primary, unset any existing primary
    if (dto.isPrimary) {
      await this.prisma.property.updateMany({
        where: { customerId: dto.customerId, workspaceId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const data: Prisma.PropertyCreateInput = {
      workspace: { connect: { id: workspaceId } },
      customer: { connect: { id: dto.customerId } },
      name: dto.name,
      isPrimary: dto.isPrimary ?? false,
      street: dto.street,
      street2: dto.street2,
      city: dto.city,
      state: dto.state,
      zip: dto.zip,
      country: dto.country ?? 'US',
      lat: dto.lat,
      lng: dto.lng,
      accessNotes: dto.accessNotes,
      serviceNotes: dto.serviceNotes,
      syncStatus: SyncStatus.PENDING,
      syncVersion: 0,
    };

    const property = await this.create({ data });
    return property as Property;
  }

  /**
   * Find all properties in the workspace
   */
  async findAllProperties(): Promise<Property[]> {
    const properties = await this.findMany({
      orderBy: [{ customerId: 'asc' }, { isPrimary: 'desc' }, { name: 'asc' }],
      include: { customer: { select: { id: true, name: true } } },
    });
    return properties as Property[];
  }

  /**
   * Find all properties for a specific customer
   */
  async findPropertiesByCustomer(customerId: string): Promise<Property[]> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const properties = await this.prisma.property.findMany({
      where: { customerId, workspaceId },
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    });

    return properties;
  }

  /**
   * Find a single property by ID
   */
  async findPropertyById(id: string): Promise<Property> {
    const property = await this.findUniqueOrThrow({
      where: { id },
      include: { customer: { select: { id: true, name: true } } },
    });
    return property as Property;
  }

  /**
   * Get the primary property for a customer
   */
  async getPrimaryProperty(customerId: string): Promise<Property | null> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const property = await this.prisma.property.findFirst({
      where: { customerId, workspaceId, isPrimary: true },
    });

    return property;
  }

  /**
   * Update a property
   */
  async updateProperty(id: string, dto: UpdatePropertyDto): Promise<Property> {
    const existing = await this.findPropertyById(id);
    const workspaceId = this.getWorkspaceIdOrThrow();

    // If setting as primary, unset other primaries for this customer
    if (dto.isPrimary === true) {
      await this.prisma.property.updateMany({
        where: {
          customerId: existing.customerId,
          workspaceId,
          isPrimary: true,
          id: { not: id },
        },
        data: { isPrimary: false },
      });
    }

    const data: Prisma.PropertyUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.isPrimary !== undefined && { isPrimary: dto.isPrimary }),
      ...(dto.street !== undefined && { street: dto.street }),
      ...(dto.street2 !== undefined && { street2: dto.street2 }),
      ...(dto.city !== undefined && { city: dto.city }),
      ...(dto.state !== undefined && { state: dto.state }),
      ...(dto.zip !== undefined && { zip: dto.zip }),
      ...(dto.country !== undefined && { country: dto.country }),
      ...(dto.lat !== undefined && { lat: dto.lat }),
      ...(dto.lng !== undefined && { lng: dto.lng }),
      ...(dto.accessNotes !== undefined && { accessNotes: dto.accessNotes }),
      ...(dto.serviceNotes !== undefined && { serviceNotes: dto.serviceNotes }),
      syncStatus: SyncStatus.PENDING,
      syncVersion: existing.syncVersion + 1,
    };

    const property = await this.update({
      where: { id },
      data,
    });

    return property as Property;
  }

  /**
   * Set a property as primary for its customer
   */
  async setPrimaryProperty(id: string): Promise<Property> {
    const property = await this.findPropertyById(id);
    const workspaceId = this.getWorkspaceIdOrThrow();

    // Unset any existing primary for this customer
    await this.prisma.property.updateMany({
      where: {
        customerId: property.customerId,
        workspaceId,
        isPrimary: true,
      },
      data: { isPrimary: false },
    });

    // Set this property as primary
    const updated = await this.update({
      where: { id },
      data: {
        isPrimary: true,
        syncStatus: SyncStatus.PENDING,
        syncVersion: property.syncVersion + 1,
      },
    });

    return updated as Property;
  }

  /**
   * Delete a property
   */
  async deleteProperty(id: string): Promise<Property> {
    const property = await this.findPropertyById(id);

    // Check if property is referenced by any jobs
    const jobCount = await this.prisma.job.count({
      where: { propertyId: id },
    });

    if (jobCount > 0) {
      throw new BadRequestException(
        `Cannot delete property: it is referenced by ${jobCount} job(s)`,
      );
    }

    // Check if property is referenced by any recurring templates
    const templateCount = await this.prisma.recurringJobTemplate.count({
      where: { propertyId: id },
    });

    if (templateCount > 0) {
      throw new BadRequestException(
        `Cannot delete property: it is referenced by ${templateCount} recurring template(s)`,
      );
    }

    const deleted = await this.delete({ where: { id } });
    return deleted as Property;
  }

  /**
   * Search properties by name or address
   */
  async searchProperties(query: string): Promise<Property[]> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const properties = await this.prisma.property.findMany({
      where: {
        workspaceId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { street: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { zip: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
      take: 20,
    });

    return properties;
  }

  /**
   * Get property with full customer and jobs information
   */
  async getPropertyWithRelations(
    id: string,
  ): Promise<Property & { customer: any; jobs: any[] }> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const property = await this.prisma.property.findFirst({
      where: { id, workspaceId },
      include: {
        customer: true,
        jobs: {
          orderBy: { scheduledAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  /**
   * Migrate a customer's legacy address JSON to a new Property record
   * Useful for data migration from the old address field
   */
  async migrateCustomerAddressToProperty(
    customerId: string,
    propertyName: string = 'Primary',
  ): Promise<Property | null> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, workspaceId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // If no legacy address, nothing to migrate
    if (!customer.address) {
      return null;
    }

    const legacyAddress = customer.address as {
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      lat?: number;
      lng?: number;
    };

    // Check if a property already exists for this customer
    const existingProperty = await this.prisma.property.findFirst({
      where: { customerId, workspaceId },
    });

    if (existingProperty) {
      // Customer already has properties, skip migration
      return null;
    }

    // Create a new property from the legacy address
    const property = await this.createProperty({
      customerId,
      name: propertyName,
      isPrimary: true,
      street: legacyAddress.street,
      city: legacyAddress.city,
      state: legacyAddress.state,
      zip: legacyAddress.zip,
      lat: legacyAddress.lat,
      lng: legacyAddress.lng,
    });

    return property;
  }
}
