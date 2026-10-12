"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
const common_1 = require("@nestjs/common");
const workspace_context_1 = require("../core/database/workspace-context");
class BaseService {
    constructor(prisma, delegate, modelName) {
        this.prisma = prisma;
        this.delegate = delegate;
        this.modelName = modelName;
    }
    getWorkspaceIdOrThrow() {
        const workspaceId = (0, workspace_context_1.getWorkspaceId)();
        if (!workspaceId) {
            throw new common_1.BadRequestException(`Workspace context is required for ${this.modelName} operations.`);
        }
        return workspaceId;
    }
    withWorkspaceWhere(args) {
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
    async findMany(args = {}) {
        return this.delegate.findMany(this.withWorkspaceWhere(args));
    }
    async findUniqueOrThrow(args) {
        const result = await this.delegate.findFirst(this.withWorkspaceWhere(args));
        if (!result) {
            throw new common_1.NotFoundException(`${this.modelName} not found`);
        }
        return result;
    }
    async create(args) {
        this.getWorkspaceIdOrThrow();
        return this.delegate.create(args);
    }
    async update(args) {
        return this.delegate.update(this.withWorkspaceWhere(args));
    }
    async delete(args) {
        return this.delegate.delete(this.withWorkspaceWhere(args));
    }
}
exports.BaseService = BaseService;
