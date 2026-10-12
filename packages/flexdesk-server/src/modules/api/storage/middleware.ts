import { Prisma } from '@prisma/client';

/**
 * Prisma middleware type definition for Prisma 6.x compatibility
 */
interface MiddlewareArgs {
  where?: Record<string, unknown>;
  data?: Record<string, unknown> | Record<string, unknown>[];
  create?: Record<string, unknown>;
  update?: Record<string, unknown>;
  [key: string]: unknown;
}

type MiddlewareParams = {
  model?: string;
  action: string;
  args: MiddlewareArgs;
  dataPath: string[];
  runInTransaction: boolean;
};

type MiddlewareNext = (params: MiddlewareParams) => Promise<unknown>;

/**
 * Prisma Middleware to enforce workspaceId scoping (Row Level Security)
 * 
 * This middleware automatically adds workspaceId filtering to all queries
 * and ensures workspaceId is set on all create/update operations.
 */

// Context to store current workspaceId (set by request context)
let currentWorkspaceId: string | null = null;

/**
 * Set the current workspace ID for the request context
 * This should be called at the start of each request handler
 */
export function setWorkspaceContext(workspaceId: string | null): void {
  currentWorkspaceId = workspaceId;
}

/**
 * Get the current workspace ID from context
 */
export function getWorkspaceContext(): string | null {
  return currentWorkspaceId;
}

/**
 * Models that require workspaceId scoping
 */
const WORKSPACE_SCOPED_MODELS = [
  'Job',
  'Technician',
  'Customer',
  'Invoice',
  'WorkspaceMember',
] as const;

/**
 * Models that don't require workspaceId (global models)
 */
const GLOBAL_MODELS = ['User', 'Workspace'] as const;

/**
 * Check if a model requires workspaceId scoping
 */
function requiresWorkspaceScoping(model: string): boolean {
  return WORKSPACE_SCOPED_MODELS.includes(model as any);
}

/**
 * Prisma middleware to enforce workspaceId scoping
 */
export const workspaceMiddleware = async (params: MiddlewareParams, next: MiddlewareNext): Promise<unknown> => {
  const { model, action, args } = params;

  // Skip middleware if no model or workspace context not set
  if (!model || currentWorkspaceId === null) {
    // Allow User and Workspace queries without workspaceId
    if (model && GLOBAL_MODELS.includes(model as any)) {
      return next(params);
    }
    
    // For workspace-scoped models, require workspaceId
    if (model && requiresWorkspaceScoping(model)) {
      throw new Error(
        `Workspace context required for ${model} operations. Call setWorkspaceContext() first.`
      );
    }
    
    return next(params);
  }

  // Apply workspaceId scoping to workspace-scoped models
  if (requiresWorkspaceScoping(model)) {
    switch (action) {
      case 'findMany':
      case 'findFirst':
      case 'findUnique':
        // Add workspaceId filter to where clause
        args.where = {
          ...args.where,
          workspaceId: currentWorkspaceId,
        };
        break;

      case 'create':
      case 'createMany':
        // Ensure workspaceId is set on create
        if (action === 'create' && args.data && typeof args.data === 'object' && !Array.isArray(args.data)) {
          args.data = {
            ...(args.data as Record<string, unknown>),
            workspaceId: currentWorkspaceId,
          };
        } else if (action === 'createMany' && Array.isArray(args.data)) {
          // For createMany, ensure each item has workspaceId
          args.data = (args.data as Record<string, unknown>[]).map((item) => ({
            ...item,
            workspaceId: currentWorkspaceId,
          }));
        }
        break;

      case 'update':
      case 'updateMany':
        // Add workspaceId filter to where clause
        args.where = {
          ...args.where,
          workspaceId: currentWorkspaceId,
        };
        break;

      case 'delete':
      case 'deleteMany':
        // Add workspaceId filter to where clause
        args.where = {
          ...args.where,
          workspaceId: currentWorkspaceId,
        };
        break;

      case 'upsert':
        // Add workspaceId to both where and create/update data
        args.where = {
          ...args.where,
          workspaceId: currentWorkspaceId,
        };
        args.create = {
          ...args.create,
          workspaceId: currentWorkspaceId,
        };
        args.update = {
          ...args.update,
          workspaceId: currentWorkspaceId,
        };
        break;

      case 'aggregate':
      case 'groupBy':
        // Add workspaceId filter to where clause
        args.where = {
          ...args.where,
          workspaceId: currentWorkspaceId,
        };
        break;

      case 'count':
        // Add workspaceId filter to where clause
        if (args.where) {
          args.where = {
            ...args.where,
            workspaceId: currentWorkspaceId,
          };
        } else {
          args.where = {
            workspaceId: currentWorkspaceId,
          };
        }
        break;
    }
  }

  return next(params);
};

/**
 * NestJS interceptor to set workspace context from request
 */
export function createWorkspaceInterceptor() {
  return {
    intercept: (context: any, next: any) => {
      const request = context.switchToHttp().getRequest();
      const workspaceId =
        request.user?.workspaceId ||
        request.headers['x-workspace-id'] ||
        null;
      
      setWorkspaceContext(workspaceId);
      
      return next.handle();
    },
  };
}

