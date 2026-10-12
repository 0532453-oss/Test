import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  type Estimate,
  EstimateStatus,
  JobPriority,
  JobStatus,
  Prisma,
  SyncStatus,
} from '@prisma/client';

import { PrismaService } from '@/core/database/prisma.service';
import { getWorkspaceId } from '@/core/database/workspace-context';

const DEFAULT_TAX_RATE = parseFloat(process.env.DEFAULT_TAX_RATE ?? '0.1');
const DEFAULT_ESTIMATE_VALIDITY_DAYS = parseInt(
  process.env.DEFAULT_ESTIMATE_VALIDITY_DAYS ?? '30',
  10,
);

export interface CreateEstimateInput {
  customerId: string;
  title: string;
  description?: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    serviceType?: string;
  }[];
  discount?: number;
  taxRate?: number;
  validUntil?: Date;
  estimatedDuration?: number;
  location?: { address: string; lat?: number; lng?: number };
  priority?: JobPriority;
  customerNotes?: string;
  notes?: string;
  terms?: string;
}

export interface UpdateEstimateInput {
  title?: string;
  description?: string;
  lineItems?: {
    description: string;
    quantity: number;
    unitPrice: number;
    serviceType?: string;
  }[];
  discount?: number;
  taxRate?: number;
  validUntil?: Date;
  estimatedDuration?: number;
  location?: { address: string; lat?: number; lng?: number };
  priority?: JobPriority;
  customerNotes?: string;
  notes?: string;
  terms?: string;
}

export interface ConvertToJobInput {
  technicianId?: string;
  scheduledAt?: Date;
}

@Injectable()
export class EstimateService {
  constructor(private readonly prisma: PrismaService) {}

  private getWorkspaceIdOrThrow(): string {
    const workspaceId = getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Workspace context is required');
    }
    return workspaceId;
  }

  async findAll(status?: EstimateStatus): Promise<Estimate[]> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const where: Prisma.EstimateWhereInput = { workspaceId };
    if (status) {
      where.status = status;
    }

    return this.prisma.estimate.findMany({
      where,
      include: {
        customer: true,
        lineItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Estimate> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const estimate = await this.prisma.estimate.findFirst({
      where: { id, workspaceId },
      include: {
        customer: true,
        lineItems: true,
        convertedJob: true,
      },
    });

    if (!estimate) {
      throw new NotFoundException('Estimate not found');
    }

    return estimate;
  }

  async findByCustomer(customerId: string): Promise<Estimate[]> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    return this.prisma.estimate.findMany({
      where: { workspaceId, customerId },
      include: {
        lineItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: CreateEstimateInput): Promise<Estimate> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    // Verify customer exists
    const customer = await this.prisma.customer.findFirst({
      where: { id: input.customerId, workspaceId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Calculate totals
    const taxRate = input.taxRate ?? DEFAULT_TAX_RATE;
    const discount = input.discount ?? 0;

    let subtotal = 0;
    const lineItemsData = input.lineItems.map((item) => {
      const total = item.quantity * item.unitPrice;
      subtotal += total;
      return {
        description: item.description,
        quantity: new Prisma.Decimal(item.quantity),
        unitPrice: new Prisma.Decimal(item.unitPrice),
        total: new Prisma.Decimal(total),
        serviceType: item.serviceType,
      };
    });

    const tax = subtotal * taxRate;
    const total = subtotal + tax - discount;

    // Calculate valid until date
    const now = new Date();
    const validUntil =
      input.validUntil ??
      new Date(now.getTime() + DEFAULT_ESTIMATE_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

    const estimateNumber = this.generateEstimateNumber();

    return this.prisma.estimate.create({
      data: {
        workspaceId,
        customerId: input.customerId,
        estimateNumber,
        title: input.title,
        description: input.description,
        subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
        tax: new Prisma.Decimal(tax.toFixed(2)),
        discount: new Prisma.Decimal(discount.toFixed(2)),
        total: new Prisma.Decimal(total.toFixed(2)),
        validUntil,
        estimatedDuration: input.estimatedDuration,
        location: input.location === null || input.location === undefined ? Prisma.JsonNull : (input.location as Prisma.InputJsonValue),
        priority: input.priority ?? JobPriority.MEDIUM,
        customerNotes: input.customerNotes,
        notes: input.notes,
        terms: input.terms,
        lineItems: {
          create: lineItemsData,
        },
      },
      include: {
        customer: true,
        lineItems: true,
      },
    });
  }

  async update(id: string, input: UpdateEstimateInput): Promise<Estimate> {
    const estimate = await this.findById(id);

    if (estimate.status !== EstimateStatus.DRAFT) {
      throw new BadRequestException('Only draft estimates can be modified');
    }

    // If line items are being updated, recalculate totals
    let updateData: Prisma.EstimateUpdateInput = {
      title: input.title,
      description: input.description,
      validUntil: input.validUntil,
      estimatedDuration: input.estimatedDuration,
      location: input.location === null || input.location === undefined ? undefined : (input.location as Prisma.InputJsonValue),
      priority: input.priority,
      customerNotes: input.customerNotes,
      notes: input.notes,
      terms: input.terms,
      syncStatus: SyncStatus.PENDING,
      syncVersion: estimate.syncVersion + 1,
    };

    if (input.lineItems) {
      const taxRate = input.taxRate ?? DEFAULT_TAX_RATE;
      const discount = input.discount ?? 0;

      let subtotal = 0;
      const lineItemsData = input.lineItems.map((item) => {
        const total = item.quantity * item.unitPrice;
        subtotal += total;
        return {
          description: item.description,
          quantity: new Prisma.Decimal(item.quantity),
          unitPrice: new Prisma.Decimal(item.unitPrice),
          total: new Prisma.Decimal(total),
          serviceType: item.serviceType,
        };
      });

      const tax = subtotal * taxRate;
      const total = subtotal + tax - discount;

      updateData = {
        ...updateData,
        subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
        tax: new Prisma.Decimal(tax.toFixed(2)),
        discount: new Prisma.Decimal(discount.toFixed(2)),
        total: new Prisma.Decimal(total.toFixed(2)),
        lineItems: {
          deleteMany: {},
          create: lineItemsData,
        },
      };
    }

    return this.prisma.estimate.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        lineItems: true,
      },
    });
  }

  async send(id: string): Promise<Estimate> {
    const estimate = await this.findById(id);

    if (estimate.status !== EstimateStatus.DRAFT) {
      throw new BadRequestException('Only draft estimates can be sent');
    }

    return this.prisma.estimate.update({
      where: { id },
      data: {
        status: EstimateStatus.SENT,
        sentAt: new Date(),
        syncStatus: SyncStatus.PENDING,
        syncVersion: estimate.syncVersion + 1,
      },
      include: {
        customer: true,
        lineItems: true,
      },
    });
  }

  async markViewed(id: string): Promise<Estimate> {
    const estimate = await this.findById(id);

    if (estimate.status !== EstimateStatus.SENT) {
      throw new BadRequestException('Only sent estimates can be marked as viewed');
    }

    return this.prisma.estimate.update({
      where: { id },
      data: {
        status: EstimateStatus.VIEWED,
        viewedAt: new Date(),
        syncStatus: SyncStatus.PENDING,
        syncVersion: estimate.syncVersion + 1,
      },
      include: {
        customer: true,
        lineItems: true,
      },
    });
  }

  async accept(id: string): Promise<Estimate> {
    const estimate = await this.findById(id);

    if (
      estimate.status !== EstimateStatus.SENT &&
      estimate.status !== EstimateStatus.VIEWED
    ) {
      throw new BadRequestException(
        'Only sent or viewed estimates can be accepted',
      );
    }

    return this.prisma.estimate.update({
      where: { id },
      data: {
        status: EstimateStatus.ACCEPTED,
        respondedAt: new Date(),
        syncStatus: SyncStatus.PENDING,
        syncVersion: estimate.syncVersion + 1,
      },
      include: {
        customer: true,
        lineItems: true,
      },
    });
  }

  async reject(id: string): Promise<Estimate> {
    const estimate = await this.findById(id);

    if (
      estimate.status !== EstimateStatus.SENT &&
      estimate.status !== EstimateStatus.VIEWED
    ) {
      throw new BadRequestException(
        'Only sent or viewed estimates can be rejected',
      );
    }

    return this.prisma.estimate.update({
      where: { id },
      data: {
        status: EstimateStatus.REJECTED,
        respondedAt: new Date(),
        syncStatus: SyncStatus.PENDING,
        syncVersion: estimate.syncVersion + 1,
      },
      include: {
        customer: true,
        lineItems: true,
      },
    });
  }

  async convertToJob(id: string, input: ConvertToJobInput = {}): Promise<Estimate> {
    const estimate = await this.findById(id);

    if (estimate.status !== EstimateStatus.ACCEPTED) {
      throw new BadRequestException(
        'Only accepted estimates can be converted to jobs',
      );
    }

    if (estimate.convertedJobId) {
      throw new BadRequestException(
        'This estimate has already been converted to a job',
      );
    }

    // Create the job
    const job = await this.prisma.job.create({
      data: {
        workspaceId: estimate.workspaceId,
        customerId: estimate.customerId,
        technicianId: input.technicianId,
        title: estimate.title,
        description: estimate.description,
        status: JobStatus.SCHEDULED,
        priority: estimate.priority,
        scheduledAt: input.scheduledAt,
        estimatedDuration: estimate.estimatedDuration,
        location: estimate.location === null ? Prisma.JsonNull : (estimate.location as Prisma.InputJsonValue),
      },
    });

    // Update the estimate
    return this.prisma.estimate.update({
      where: { id },
      data: {
        status: EstimateStatus.CONVERTED,
        convertedJobId: job.id,
        syncStatus: SyncStatus.PENDING,
        syncVersion: estimate.syncVersion + 1,
      },
      include: {
        customer: true,
        lineItems: true,
        convertedJob: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    const estimate = await this.findById(id);

    if (estimate.status !== EstimateStatus.DRAFT) {
      throw new BadRequestException('Only draft estimates can be deleted');
    }

    await this.prisma.estimate.delete({
      where: { id },
    });
  }

  async checkExpiredEstimates(): Promise<number> {
    const workspaceId = this.getWorkspaceIdOrThrow();
    const now = new Date();

    const result = await this.prisma.estimate.updateMany({
      where: {
        workspaceId,
        status: {
          in: [EstimateStatus.SENT, EstimateStatus.VIEWED],
        },
        validUntil: {
          lt: now,
        },
      },
      data: {
        status: EstimateStatus.EXPIRED,
        syncStatus: SyncStatus.PENDING,
      },
    });

    return result.count;
  }

  private generateEstimateNumber(): string {
    const now = new Date();
    const datePart = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');

    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();

    return `EST-${datePart}-${randomPart}`;
  }
}
