"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspaceExtension = void 0;
const client_1 = require("@prisma/client");
const workspace_context_1 = require("./workspace-context");
const WORKSPACE_SCOPED_MODELS = new Set([
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
exports.workspaceExtension = client_1.Prisma.defineExtension({
    name: 'workspace-extension',
    query: {
        $allOperations({ model, operation, args, query }) {
            if (!model || !WORKSPACE_SCOPED_MODELS.has(model)) {
                return query(args);
            }
            const workspaceId = (0, workspace_context_1.getWorkspaceId)();
            if (!workspaceId) {
                return query(args);
            }
            switch (operation) {
                case 'findUnique':
                case 'findFirst':
                case 'findMany':
                case 'updateMany':
                case 'deleteMany': {
                    const where = (args.where ?? {});
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
                    const where = (args.where ?? {});
                    return query({
                        ...args,
                        where: {
                            ...where,
                            workspaceId,
                        },
                    });
                }
                case 'create': {
                    const data = (args.data ?? {});
                    return query({
                        ...args,
                        data: {
                            ...data,
                            workspaceId: data.workspaceId ?? workspaceId,
                        },
                    });
                }
                case 'createMany': {
                    const data = (Array.isArray(args.data) ? args.data : []);
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
