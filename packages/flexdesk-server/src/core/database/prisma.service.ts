import {
  Inject,
  Injectable,
  Optional,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

import { workspaceExtension } from './workspace-middleware';

// Create the extended client type for compile-time type inference
const extendedPrismaClient = new PrismaClient().$extends(workspaceExtension);
type ExtendedPrismaClient = typeof extendedPrismaClient;

/**
 * PrismaService
 *
 * All queries automatically go through the workspace extension.
 * When a workspace context is set via AsyncLocalStorage (e.g. from
 * WorkspaceInterceptor or runWithWorkspace), queries on workspace-scoped
 * models are automatically filtered by workspaceId.
 *
 * When no workspace context exists (migrations, seeds, admin operations),
 * queries pass through unfiltered.
 *
 * If a DATABASE_URL is provided via ConfigService (e.g. with Neon pooling
 * params), it overrides the Prisma schema's env("DATABASE_URL") at runtime.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private _extended: ExtendedPrismaClient | null = null;

  /**
   * Returns the workspace-extended client. All model delegates accessed
   * through this client (e.g. .job, .customer) apply workspace filtering
   * automatically based on the current AsyncLocalStorage context.
   */
  get extended(): ExtendedPrismaClient {
    if (!this._extended) {
      this._extended = this.$extends(workspaceExtension);
    }
    return this._extended;
  }

  /**
   * Proxy: accessing prisma.job, prisma.customer, etc. routes through the
   * workspace-extended client so the RLS extension is always active.
   *
   * This makes the extension transparent — services using `this.prisma.job`
   * automatically get workspace-scoped queries without any code changes.
   */
  private static readonly PRISMA_MODEL_PROPERTIES = new Set([
    'job',
    'technician',
    'customer',
    'invoice',
    'estimate',
    'property',
    'part',
    'jobPart',
    'recurringJobTemplate',
    'role',
    'workspaceMember',
    // Non-workspace-scoped models that should still go through extended
    // client for consistency (extension passes them through unchanged)
    'workspace',
    'user',
    'notificationPreference',
    'invoiceLineItem',
    'jobNote',
    'jobAttachment',
    'estimateLineItem',
    'permission',
    'rolePermission',
    'gitHubStars',
  ]);

  constructor(
    @Optional() @Inject(ConfigService) configService?: ConfigService,
  ) {
    const databaseUrl = configService?.get<string>('database.url');
    super({
      ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
    });

    // Return a Proxy so that property access to model delegates (e.g.
    // prisma.job) is automatically forwarded to the extended client.
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (
          typeof prop === 'string' &&
          PrismaService.PRISMA_MODEL_PROPERTIES.has(prop)
        ) {
          return (target.extended as any)[prop];
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
