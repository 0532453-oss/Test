"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspaceMiddleware = void 0;
exports.setWorkspaceContext = setWorkspaceContext;
exports.getWorkspaceContext = getWorkspaceContext;
exports.createWorkspaceInterceptor = createWorkspaceInterceptor;
let currentWorkspaceId = null;
function setWorkspaceContext(workspaceId) {
    currentWorkspaceId = workspaceId;
}
function getWorkspaceContext() {
    return currentWorkspaceId;
}
const WORKSPACE_SCOPED_MODELS = [
    'Job',
    'Technician',
    'Customer',
    'Invoice',
    'WorkspaceMember',
];
const GLOBAL_MODELS = ['User', 'Workspace'];
function requiresWorkspaceScoping(model) {
    return WORKSPACE_SCOPED_MODELS.includes(model);
}
const workspaceMiddleware = async (params, next) => {
    const { model, action, args } = params;
    if (!model || currentWorkspaceId === null) {
        if (model && GLOBAL_MODELS.includes(model)) {
            return next(params);
        }
        if (model && requiresWorkspaceScoping(model)) {
            throw new Error(`Workspace context required for ${model} operations. Call setWorkspaceContext() first.`);
        }
        return next(params);
    }
    if (requiresWorkspaceScoping(model)) {
        switch (action) {
            case 'findMany':
            case 'findFirst':
            case 'findUnique':
                args.where = {
                    ...args.where,
                    workspaceId: currentWorkspaceId,
                };
                break;
            case 'create':
            case 'createMany':
                if (action === 'create' && args.data && typeof args.data === 'object' && !Array.isArray(args.data)) {
                    args.data = {
                        ...args.data,
                        workspaceId: currentWorkspaceId,
                    };
                }
                else if (action === 'createMany' && Array.isArray(args.data)) {
                    args.data = args.data.map((item) => ({
                        ...item,
                        workspaceId: currentWorkspaceId,
                    }));
                }
                break;
            case 'update':
            case 'updateMany':
                args.where = {
                    ...args.where,
                    workspaceId: currentWorkspaceId,
                };
                break;
            case 'delete':
            case 'deleteMany':
                args.where = {
                    ...args.where,
                    workspaceId: currentWorkspaceId,
                };
                break;
            case 'upsert':
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
                args.where = {
                    ...args.where,
                    workspaceId: currentWorkspaceId,
                };
                break;
            case 'count':
                if (args.where) {
                    args.where = {
                        ...args.where,
                        workspaceId: currentWorkspaceId,
                    };
                }
                else {
                    args.where = {
                        workspaceId: currentWorkspaceId,
                    };
                }
                break;
        }
    }
    return next(params);
};
exports.workspaceMiddleware = workspaceMiddleware;
function createWorkspaceInterceptor() {
    return {
        intercept: (context, next) => {
            const request = context.switchToHttp().getRequest();
            const workspaceId = request.user?.workspaceId ||
                request.headers['x-workspace-id'] ||
                null;
            setWorkspaceContext(workspaceId);
            return next.handle();
        },
    };
}
