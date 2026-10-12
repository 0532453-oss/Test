import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { type AddJobPartDto } from './dto/add-job-part.dto';
import { type CreatePartDto } from './dto/create-part.dto';
import { type UpdateJobPartDto } from './dto/update-job-part.dto';
import { type UpdatePartDto } from './dto/update-part.dto';

import { PrismaService } from '@/core/database/prisma.service';
import { BaseService } from '@/engine/base.service';


@Injectable()
export class PartService extends BaseService<typeof PrismaService.prototype.part> {
  constructor(private readonly prismaService: PrismaService) {
    super(prismaService, prismaService.part, 'Part');
  }

  /**
   * Create a new part in the inventory
   */
  async createPart(dto: CreatePartDto) {
    const workspaceId = this.getWorkspaceIdOrThrow();

    // Check for SKU uniqueness within workspace if provided
    if (dto.sku) {
      const existingSku = await this.prisma.part.findFirst({
        where: { workspaceId, sku: dto.sku },
      });

      if (existingSku) {
        throw new ConflictException(`Part with SKU "${dto.sku}" already exists`);
      }
    }

    return this.prisma.part.create({
      data: {
        workspaceId,
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        unitCost: new Prisma.Decimal(dto.unitCost),
        unitPrice: new Prisma.Decimal(dto.unitPrice),
        quantityOnHand: dto.quantityOnHand ?? 0,
        reorderPoint: dto.reorderPoint ?? 5,
        reorderQuantity: dto.reorderQuantity ?? 10,
        isActive: dto.isActive ?? true,
      },
    });
  }

  /**
   * Update an existing part
   */
  async updatePart(partId: string, dto: UpdatePartDto) {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const part = await this.prisma.part.findFirst({
      where: { id: partId, workspaceId },
    });

    if (!part) {
      throw new NotFoundException('Part not found');
    }

    // Check SKU uniqueness if being changed
    if (dto.sku && dto.sku !== part.sku) {
      const existingSku = await this.prisma.part.findFirst({
        where: { workspaceId, sku: dto.sku, id: { not: partId } },
      });

      if (existingSku) {
        throw new ConflictException(`Part with SKU "${dto.sku}" already exists`);
      }
    }

    return this.prisma.part.update({
      where: { id: partId },
      data: {
        ...(dto.sku !== undefined && { sku: dto.sku }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.unitCost !== undefined && { unitCost: new Prisma.Decimal(dto.unitCost) }),
        ...(dto.unitPrice !== undefined && { unitPrice: new Prisma.Decimal(dto.unitPrice) }),
        ...(dto.quantityOnHand !== undefined && { quantityOnHand: dto.quantityOnHand }),
        ...(dto.reorderPoint !== undefined && { reorderPoint: dto.reorderPoint }),
        ...(dto.reorderQuantity !== undefined && { reorderQuantity: dto.reorderQuantity }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        syncVersion: part.syncVersion + 1,
      },
    });
  }

  /**
   * Get a part by ID
   */
  async getPartById(partId: string) {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const part = await this.prisma.part.findFirst({
      where: { id: partId, workspaceId },
    });

    if (!part) {
      throw new NotFoundException('Part not found');
    }

    return part;
  }

  /**
   * List all parts with optional filtering
   */
  async listParts(filters?: {
    category?: string;
    isActive?: boolean;
    lowStock?: boolean;
    search?: string;
  }) {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const where: Prisma.PartWhereInput = { workspaceId };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.lowStock) {
      where.quantityOnHand = { lte: this.prisma.part.fields.reorderPoint as any };
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.part.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Get parts with low stock (below reorder point)
   */
  async getLowStockParts() {
    const workspaceId = this.getWorkspaceIdOrThrow();

    // Tagged template literals are parameterized by Prisma (safe from SQL injection).
    // Column-to-column comparison requires raw query since Prisma doesn't support it natively.
    return this.prisma.$queryRaw<Array<{
      id: string;
      workspaceId: string;
      sku: string | null;
      name: string;
      description: string | null;
      category: string | null;
      unitCost: number;
      unitPrice: number;
      quantityOnHand: number;
      reorderPoint: number;
      reorderQuantity: number;
      isActive: boolean;
    }>>`
      SELECT * FROM parts
      WHERE "workspaceId" = ${workspaceId}::uuid
      AND "quantityOnHand" <= "reorderPoint"
      AND "isActive" = true
      ORDER BY ("reorderPoint" - "quantityOnHand") DESC
    `;
  }

  /**
   * Adjust part inventory quantity
   */
  async adjustInventory(partId: string, adjustment: number, reason?: string) {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const part = await this.prisma.part.findFirst({
      where: { id: partId, workspaceId },
    });

    if (!part) {
      throw new NotFoundException('Part not found');
    }

    const newQuantity = part.quantityOnHand + adjustment;

    if (newQuantity < 0) {
      throw new BadRequestException('Adjustment would result in negative inventory');
    }

    return this.prisma.part.update({
      where: { id: partId },
      data: {
        quantityOnHand: newQuantity,
        syncVersion: part.syncVersion + 1,
      },
    });
  }

  /**
   * Delete a part (soft delete by setting isActive = false)
   */
  async deletePart(partId: string) {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const part = await this.prisma.part.findFirst({
      where: { id: partId, workspaceId },
    });

    if (!part) {
      throw new NotFoundException('Part not found');
    }

    // Check if part is used in any jobs
    const usageCount = await this.prisma.jobPart.count({
      where: { partId },
    });

    if (usageCount > 0) {
      // Soft delete - just mark as inactive
      return this.prisma.part.update({
        where: { id: partId },
        data: {
          isActive: false,
          syncVersion: part.syncVersion + 1,
        },
      });
    }

    // Hard delete if never used
    return this.prisma.part.delete({
      where: { id: partId },
    });
  }

  /**
   * Get part categories in the workspace
   */
  async getCategories() {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const categories = await this.prisma.part.groupBy({
      by: ['category'],
      where: { workspaceId, category: { not: null } },
      orderBy: { category: 'asc' },
    });

    return categories.map((c) => c.category).filter(Boolean);
  }

  // =========== Job Part Methods ===========

  /**
   * Add a part to a job
   */
  async addPartToJob(jobId: string, dto: AddJobPartDto) {
    const workspaceId = this.getWorkspaceIdOrThrow();

    // Verify job exists and belongs to workspace
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, workspaceId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Verify part exists and belongs to workspace
    const part = await this.prisma.part.findFirst({
      where: { id: dto.partId, workspaceId },
    });

    if (!part) {
      throw new NotFoundException('Part not found');
    }

    if (!part.isActive) {
      throw new BadRequestException('Cannot add inactive part to job');
    }

    // Check if part is already on this job
    const existingJobPart = await this.prisma.jobPart.findFirst({
      where: { jobId, partId: dto.partId },
    });

    if (existingJobPart) {
      throw new ConflictException('Part is already added to this job. Use update to change quantity.');
    }

    // Check inventory availability
    if (dto.quantity > part.quantityOnHand) {
      throw new BadRequestException(
        `Insufficient inventory. Available: ${part.quantityOnHand}, Requested: ${dto.quantity}`,
      );
    }

    const unitPrice = dto.unitPrice !== undefined
      ? new Prisma.Decimal(dto.unitPrice)
      : part.unitPrice;

    const total = unitPrice.mul(new Prisma.Decimal(dto.quantity));

    // Create job part and deduct inventory in a transaction
    const [jobPart] = await this.prisma.$transaction([
      this.prisma.jobPart.create({
        data: {
          jobId,
          partId: dto.partId,
          quantity: new Prisma.Decimal(dto.quantity),
          unitPrice,
          total,
          notes: dto.notes,
        },
        include: {
          part: true,
        },
      }),
      this.prisma.part.update({
        where: { id: dto.partId },
        data: {
          quantityOnHand: part.quantityOnHand - Math.ceil(dto.quantity),
          syncVersion: part.syncVersion + 1,
        },
      }),
    ]);

    return jobPart;
  }

  /**
   * Update a job part
   */
  async updateJobPart(jobPartId: string, dto: UpdateJobPartDto) {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const jobPart = await this.prisma.jobPart.findFirst({
      where: { id: jobPartId },
      include: {
        job: true,
        part: true,
      },
    });

    if (!jobPart || jobPart.job.workspaceId !== workspaceId) {
      throw new NotFoundException('Job part not found');
    }

    // Calculate inventory adjustment if quantity changed
    let inventoryAdjustment = 0;
    if (dto.quantity !== undefined) {
      const oldQuantity = Number(jobPart.quantity);
      inventoryAdjustment = oldQuantity - dto.quantity;

      // Check if we have enough inventory for an increase
      if (inventoryAdjustment < 0) {
        const additionalNeeded = Math.abs(inventoryAdjustment);
        if (additionalNeeded > jobPart.part.quantityOnHand) {
          throw new BadRequestException(
            `Insufficient inventory. Available: ${jobPart.part.quantityOnHand}, Additional needed: ${additionalNeeded}`,
          );
        }
      }
    }

    const newQuantity = dto.quantity !== undefined
      ? new Prisma.Decimal(dto.quantity)
      : jobPart.quantity;

    const newUnitPrice = dto.unitPrice !== undefined
      ? new Prisma.Decimal(dto.unitPrice)
      : jobPart.unitPrice;

    const newTotal = newUnitPrice.mul(newQuantity);

    const updates: any[] = [
      this.prisma.jobPart.update({
        where: { id: jobPartId },
        data: {
          ...(dto.quantity !== undefined && { quantity: newQuantity }),
          ...(dto.unitPrice !== undefined && { unitPrice: newUnitPrice }),
          total: newTotal,
          ...(dto.notes !== undefined && { notes: dto.notes }),
          syncVersion: jobPart.syncVersion + 1,
        },
        include: {
          part: true,
        },
      }),
    ];

    // Add inventory adjustment if needed
    if (inventoryAdjustment !== 0) {
      updates.push(
        this.prisma.part.update({
          where: { id: jobPart.partId },
          data: {
            quantityOnHand: jobPart.part.quantityOnHand + Math.ceil(inventoryAdjustment),
            syncVersion: jobPart.part.syncVersion + 1,
          },
        }),
      );
    }

    const [updatedJobPart] = await this.prisma.$transaction(updates);
    return updatedJobPart;
  }

  /**
   * Remove a part from a job
   */
  async removePartFromJob(jobPartId: string) {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const jobPart = await this.prisma.jobPart.findFirst({
      where: { id: jobPartId },
      include: {
        job: true,
        part: true,
      },
    });

    if (!jobPart || jobPart.job.workspaceId !== workspaceId) {
      throw new NotFoundException('Job part not found');
    }

    // Return inventory and delete job part in a transaction
    await this.prisma.$transaction([
      this.prisma.part.update({
        where: { id: jobPart.partId },
        data: {
          quantityOnHand: jobPart.part.quantityOnHand + Math.ceil(Number(jobPart.quantity)),
          syncVersion: jobPart.part.syncVersion + 1,
        },
      }),
      this.prisma.jobPart.delete({
        where: { id: jobPartId },
      }),
    ]);

    return { deleted: true };
  }

  /**
   * Get all parts for a job
   */
  async getJobParts(jobId: string) {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const job = await this.prisma.job.findFirst({
      where: { id: jobId, workspaceId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.prisma.jobPart.findMany({
      where: { jobId },
      include: {
        part: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get total parts cost/price for a job
   */
  async getJobPartsTotals(jobId: string) {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const job = await this.prisma.job.findFirst({
      where: { id: jobId, workspaceId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const jobParts = await this.prisma.jobPart.findMany({
      where: { jobId },
      include: { part: true },
    });

    let totalCost = new Prisma.Decimal(0);
    let totalPrice = new Prisma.Decimal(0);

    for (const jp of jobParts) {
      totalCost = totalCost.add(jp.part.unitCost.mul(jp.quantity));
      totalPrice = totalPrice.add(jp.total);
    }

    return {
      jobId,
      partsCount: jobParts.length,
      totalCost: Number(totalCost),
      totalPrice: Number(totalPrice),
      profit: Number(totalPrice.sub(totalCost)),
    };
  }
}
