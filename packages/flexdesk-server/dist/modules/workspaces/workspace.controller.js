"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let WorkspaceController = class WorkspaceController {
    constructor(workspaceService) {
        this.workspaceService = workspaceService;
    }
    async create(dto, user) {
        return this.workspaceService.createWorkspace(dto, user.id);
    }
    async getMyWorkspaces(user) {
        return this.workspaceService.getUserWorkspaces(user.id);
    }
    async getById(id) {
        return this.workspaceService.getWorkspaceById(id);
    }
    async getStats(id) {
        return this.workspaceService.getWorkspaceStats(id);
    }
    async update(id, dto, user) {
        return this.workspaceService.updateWorkspace(id, dto, user.id);
    }
    async addMember(id, dto, user) {
        return this.workspaceService.addMember(id, dto, user.id);
    }
    async removeMember(id, memberId, user) {
        return this.workspaceService.removeMember(id, memberId, user.id);
    }
    async updateMemberRole(id, memberId, dto, user) {
        return this.workspaceService.updateMemberRole(id, memberId, dto.role, user.id);
    }
};
exports.WorkspaceController = WorkspaceController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new workspace' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Workspace created' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Subdomain already taken' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('mine'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workspaces for current user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of user workspaces' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "getMyWorkspaces", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workspace by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Workspace UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workspace not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "getById", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workspace statistics' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Workspace UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace statistics' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "getStats", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Update workspace' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Workspace UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace updated' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function, Object]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Add member to workspace' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Workspace UUID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Member added' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'User already a member' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function, Object]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "addMember", null);
__decorate([
    (0, common_1.Delete)(':id/members/:memberId'),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove member from workspace' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Workspace UUID' }),
    (0, swagger_1.ApiParam)({ name: 'memberId', description: 'Member UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Member removed' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('memberId', common_1.ParseUUIDPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Put)(':id/members/:memberId/role'),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Update member role' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Workspace UUID' }),
    (0, swagger_1.ApiParam)({ name: 'memberId', description: 'Member UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Role updated' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('memberId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Function, Object]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "updateMemberRole", null);
exports.WorkspaceController = WorkspaceController = __decorate([
    (0, swagger_1.ApiTags)('workspaces'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('workspaces'),
    __metadata("design:paramtypes", [Function])
], WorkspaceController);
