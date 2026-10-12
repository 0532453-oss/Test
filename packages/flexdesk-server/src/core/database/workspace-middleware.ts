import { Prisma } from '@prisma/client';

import { getWorkspaceId } from './workspace-context';

const WORKSPACE_SCOPED_MODELS = new Set<string>([
  'Job',
  'Technician',
  'Customer',
  'Invoice',
  'Estimate',
  'Property',
  'Part',
  'JobPart',
  'RecurringJobTemplate',
  'Role',
  'WorkspaceMember',
]);

type QueryParams = {
  model?: string;
  operation: string;
  args: Record<string, unknown>;
  query: (args: Record<string, unknown>) => Promise<unknown>;
};

/**
 * Creates a workspace-scoped query extension for Prisma
 * This replaces the deprecated $use middleware API
 */
export const workspaceExtension = Prisma.defineExtension({
  name: 'workspace-extension',
  query: {
    $allOperations({ model, operation, args, query }: QueryParams) {
      if (!model || !WORKSPACE_SCOPED_MODELS.has(model)) {
        return query(args);
      }

      const workspaceId = getWorkspaceId();

      // No workspace context (e.g. migrations, seeds, queue workers without
      // explicit context) — pass through without filtering.
      if (!workspaceId) {
        return query(args);
      }

      switch (operation) {
        case 'findUnique':
        case 'findFirst':
        case 'findMany':
        case 'updateMany':
        case 'deleteMany': {
          const where = (args.where ?? {}) as Record<string, unknown>;
          return query({
            ...args,
            where: {
              ...where,
              workspaceId,
            },
          });
        }

        case 'update':
        case 'delete': {
          const where = (args.where ?? {}) as Record<string, unknown>;
          return query({
            ...args,
            where: {
              ...where,
              workspaceId,
            },
          });
        }

        case 'create': {
          const data = (args.data ?? {}) as Record<string, unknown>;
          return query({
            ...args,
            data: {
              ...data,
              workspaceId: data.workspaceId ?? workspaceId,
            },
          });
        }

        case 'createMany': {
          const data = (Array.isArray(args.data) ? args.data : []) as Array<
            Record<string, unknown>
          >;
          return query({
            ...args,
            data: data.map((item) => ({
              ...item,
              workspaceId: item.workspaceId ?? workspaceId,
            })),
          });
        }

        default:
          return query(args);
      }
    },
  },
});
