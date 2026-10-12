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
exports.PermissionController = exports.RoleController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let RoleController = class RoleController {
    constructor(roleService) {
        this.roleService = roleService;
    }
    async createRole(dto) {
        return this.roleService.createRole(dto);
    }
    async findAllRoles() {
        return this.roleService.findAllRoles();
    }
    async getDefaultRole() {
        return this.roleService.getDefaultRole();
    }
    async findRoleById(id) {
        return this.roleService.findRoleById(id);
    }
    async findRoleByName(name) {
        return this.roleService.findRoleByName(name);
    }
    async getMembersByRole(id) {
        return this.roleService.getMembersByRole(id);
    }
    async updateRole(id, dto) {
        return this.roleService.updateRole(id, dto);
    }
    async deleteRole(id) {
        await this.roleService.deleteRole(id);
    }
    async addPermissionToRole(roleId, permissionId, scope) {
        return this.roleService.addPermissionToRole(roleId, permissionId, scope);
    }
    async removePermissionFromRole(roleId, permissionId) {
        await this.roleService.removePermissionFromRole(roleId, permissionId);
    }
    async assignRoleToMember(dto) {
        await this.roleService.assignRoleToMember(dto.memberId, dto.roleId);
    }
    async removeRoleFromMember(memberId) {
        await this.roleService.removeRoleFromMember(memberId);
    }
    async checkPermission(userId, resource, action) {
        const hasPermission = await this.roleService.hasPermission(userId, resource, action);
        return { hasPermission };
    }
    async getUserPermissions(userId) {
        return this.roleService.getUserPermissions(userId);
    }
    async initializeWorkspaceRoles() {
        const workspaceId = this.roleService.getWorkspaceIdOrThrow();
        await this.roleService.initializeWorkspaceRoles(workspaceId);
    }
};
exports.RoleController = RoleController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new role' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Role created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Role name already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "createRole", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all roles in the workspace' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of roles' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "findAllRoles", null);
__decorate([
    (0, common_1.Get)('default'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the default role for new members' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Default role or null' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "getDefaultRole", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a role by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Role ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Role details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Role not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "findRoleById", null);
__decorate([
    (0, common_1.Get)('by-name/:name'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a role by name' }),
    (0, swagger_1.ApiParam)({ name: 'name', description: 'Role name' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Role details or null' }),
    __param(0, (0, common_1.Param)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "findRoleByName", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    (0, swagger_1.ApiOperation)({ summary: 'Get members with a specific role' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Role ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of members' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "getMembersByRole", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a role' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Role ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Role updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cannot modify system role' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Role not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Role name already exists' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a role' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Role ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Role deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cannot delete system role or role with members' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Role not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "deleteRole", null);
__decorate([
    (0, common_1.Post)(':id/permissions/:permissionId'),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a permission to a role' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Role ID' }),
    (0, swagger_1.ApiParam)({ name: 'permissionId', description: 'Permission ID' }),
    (0, swagger_1.ApiQuery)({ name: 'scope', required: false, description: 'Permission scope (own, team, or null)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Permission added successfully' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Permission already assigned' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('permissionId')),
    __param(2, (0, common_1.Query)('scope')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "addPermissionToRole", null);
__decorate([
    (0, common_1.Delete)(':id/permissions/:permissionId'),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a permission from a role' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Role ID' }),
    (0, swagger_1.ApiParam)({ name: 'permissionId', description: 'Permission ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Permission removed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cannot modify system role' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('permissionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "removePermissionFromRole", null);
__decorate([
    (0, common_1.Post)('assign'),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Assign a role to a workspace member' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Role assigned successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Member or role not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "assignRoleToMember", null);
__decorate([
    (0, common_1.Delete)('assign/:memberId'),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remove role from a workspace member' }),
    (0, swagger_1.ApiParam)({ name: 'memberId', description: 'Workspace member ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Role removed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Member not found' }),
    __param(0, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "removeRoleFromMember", null);
__decorate([
    (0, common_1.Get)('check/:userId/:resource/:action'),
    (0, swagger_1.ApiOperation)({ summary: 'Check if a user has a specific permission' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    (0, swagger_1.ApiParam)({ name: 'resource', description: 'Resource type (e.g., jobs, customers)' }),
    (0, swagger_1.ApiParam)({ name: 'action', description: 'Action type (e.g., create, read, update, delete)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Permission check result' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('resource')),
    __param(2, (0, common_1.Param)('action')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "checkPermission", null);
__decorate([
    (0, common_1.Get)('user/:userId/permissions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all permissions for a user' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of user permissions' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "getUserPermissions", null);
__decorate([
    (0, common_1.Post)('initialize'),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Initialize system roles for the workspace' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'System roles initialized' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "initializeWorkspaceRoles", null);
exports.RoleController = RoleController = __decorate([
    (0, swagger_1.ApiTags)('Roles & Permissions'),
    (0, common_1.Controller)('roles'),
    __metadata("design:paramtypes", [Function])
], RoleController);
let PermissionController = class PermissionController {
    constructor(roleService) {
        this.roleService = roleService;
    }
    async findAllPermissions() {
        return this.roleService.findAllPermissions();
    }
    async findPermissionsByResource(resource) {
        return this.roleService.findPermissionsByResource(resource);
    }
    async createPermission(dto) {
        return this.roleService.createPermission(dto);
    }
    async ensureStandardPermissions() {
        await this.roleService.ensureStandardPermissions();
    }
};
exports.PermissionController = PermissionController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available permissions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of permissions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermissionController.prototype, "findAllPermissions", null);
__decorate([
    (0, common_1.Get)('by-resource/:resource'),
    (0, swagger_1.ApiOperation)({ summary: 'Get permissions for a specific resource' }),
    (0, swagger_1.ApiParam)({ name: 'resource', description: 'Resource type' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of permissions' }),
    __param(0, (0, common_1.Param)('resource')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionController.prototype, "findPermissionsByResource", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new permission (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Permission created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Permission already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], PermissionController.prototype, "createPermission", null);
__decorate([
    (0, common_1.Post)('ensure-standard'),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Ensure all standard permissions exist' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Standard permissions ensured' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermissionController.prototype, "ensureStandardPermissions", null);
exports.PermissionController = PermissionController = __decorate([
    (0, swagger_1.ApiTags)('Permissions'),
    (0, common_1.Controller)('permissions'),
    __metadata("design:paramtypes", [Function])
], PermissionController);
