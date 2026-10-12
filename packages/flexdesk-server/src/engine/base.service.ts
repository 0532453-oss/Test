import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/core/database/prisma.service';
import { getWorkspaceId } from '@/core/database/workspace-context';

/**
 * BaseService
 *
 * Provides workspace-aware helpers around a Prisma delegate.
 * Concrete services should extend this class and pass the
 * appropriate Prisma delegate (e.g. prisma.job).
 */
export abstract class BaseService<TDelegate> {
  protected constructor(
    protected readonly prisma: PrismaService,
    protected readonly delegate: TDelegate,
    private readonly modelName: string,
  ) {}

  protected getWorkspaceIdOrThrow(): string {
    const workspaceId = getWorkspaceId();

    if (!workspaceId) {
      throw new BadRequestException(
        `Workspace context is required for ${this.modelName} operations.`,
      );
    }

    return workspaceId;
  }

  protected withWorkspaceWhere<T extends { where?: Record<string, unknown> }>(
    args: T,
  ): T {
    const workspaceId = this.getWorkspaceIdOrThrow();
    const where = args.where ?? {};

    return {
      ...args,
      where: {
        ...where,
        workspaceId,
      },
    };
  }

  // The following helpers deliberately use `any` for args/return types to stay
  // generic across different Prisma delegates while still centralizing
  // workspace-aware behavior.

  async findMany(args: any = {}): Promise<any[]> {
    // @ts-expect-error - delegate is dynamic but has findMany
    return this.delegate.findMany(this.withWorkspaceWhere(args));
  }

  async findUniqueOrThrow(args: any): Promise<any> {
    // Use findFirst with workspace filter to guarantee scoping.
    // @ts-expect-error - delegate is dynamic but has findFirst
    const result = await this.delegate.findFirst(this.withWorkspaceWhere(args));

    if (!result) {
      throw new NotFoundException(`${this.modelName} not found`);
    }

    return result;
  }

  async create(args: any): Promise<any> {
    // Ensure workspace context is present so middleware can inject workspaceId.
    this.getWorkspaceIdOrThrow();

    // @ts-expect-error - delegate is dynamic but has create
    return this.delegate.create(args);
  }

  async update(args: any): Promise<any> {
    // @ts-expect-error - delegate is dynamic but has update
    return this.delegate.update(this.withWorkspaceWhere(args));
  }

  async delete(args: any): Promise<any> {
    // @ts-expect-error - delegate is dynamic but has delete
    return this.delegate.delete(this.withWorkspaceWhere(args));
  }
}

