import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';

import { type AssignRoleDto } from './dto/assign-role.dto';
import { type CreatePermissionDto } from './dto/create-permission.dto';
import { type CreateRoleDto } from './dto/create-role.dto';
import { type UpdateRoleDto } from './dto/update-role.dto';
import { RoleService } from './role.service';


@ApiTags('Roles & Permissions')
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  // ==================== ROLE ENDPOINTS ====================

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  async createRole(@Body() dto: CreateRoleDto) {
    return this.roleService.createRole(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles in the workspace' })
  @ApiResponse({ status: 200, description: 'List of roles' })
  async findAllRoles() {
    return this.roleService.findAllRoles();
  }

  @Get('default')
  @ApiOperation({ summary: 'Get the default role for new members' })
  @ApiResponse({ status: 200, description: 'Default role or null' })
  async getDefaultRole() {
    return this.roleService.getDefaultRole();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role details' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findRoleById(@Param('id') id: string) {
    return this.roleService.findRoleById(id);
  }

  @Get('by-name/:name')
  @ApiOperation({ summary: 'Get a role by name' })
  @ApiParam({ name: 'name', description: 'Role name' })
  @ApiResponse({ status: 200, description: 'Role details or null' })
  async findRoleByName(@Param('name') name: string) {
    return this.roleService.findRoleByName(name);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get members with a specific role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'List of members' })
  async getMembersByRole(@Param('id') id: string) {
    return this.roleService.getMembersByRole(id);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot modify system role' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roleService.updateRole(id, dto);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 204, description: 'Role deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete system role or role with members' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async deleteRole(@Param('id') id: string) {
    await this.roleService.deleteRole(id);
  }

  // ==================== PERMISSION MANAGEMENT ====================

  @Post(':id/permissions/:permissionId')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Add a permission to a role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiParam({ name: 'permissionId', description: 'Permission ID' })
  @ApiQuery({ name: 'scope', required: false, description: 'Permission scope (own, team, or null)' })
  @ApiResponse({ status: 201, description: 'Permission added successfully' })
  @ApiResponse({ status: 409, description: 'Permission already assigned' })
  async addPermissionToRole(
    @Param('id') roleId: string,
    @Param('permissionId') permissionId: string,
    @Query('scope') scope?: string,
  ) {
    return this.roleService.addPermissionToRole(roleId, permissionId, scope);
  }

  @Delete(':id/permissions/:permissionId')
  @Roles('OWNER', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a permission from a role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiParam({ name: 'permissionId', description: 'Permission ID' })
  @ApiResponse({ status: 204, description: 'Permission removed successfully' })
  @ApiResponse({ status: 400, description: 'Cannot modify system role' })
  async removePermissionFromRole(
    @Param('id') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    await this.roleService.removePermissionFromRole(roleId, permissionId);
  }

  // ==================== MEMBER ROLE ASSIGNMENT ====================

  @Post('assign')
  @Roles('OWNER', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Assign a role to a workspace member' })
  @ApiResponse({ status: 204, description: 'Role assigned successfully' })
  @ApiResponse({ status: 404, description: 'Member or role not found' })
  async assignRoleToMember(@Body() dto: AssignRoleDto) {
    await this.roleService.assignRoleToMember(dto.memberId, dto.roleId);
  }

  @Delete('assign/:memberId')
  @Roles('OWNER', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove role from a workspace member' })
  @ApiParam({ name: 'memberId', description: 'Workspace member ID' })
  @ApiResponse({ status: 204, description: 'Role removed successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async removeRoleFromMember(@Param('memberId') memberId: string) {
    await this.roleService.removeRoleFromMember(memberId);
  }

  // ==================== PERMISSION CHECKING ====================

  @Get('check/:userId/:resource/:action')
  @ApiOperation({ summary: 'Check if a user has a specific permission' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'resource', description: 'Resource type (e.g., jobs, customers)' })
  @ApiParam({ name: 'action', description: 'Action type (e.g., create, read, update, delete)' })
  @ApiResponse({ status: 200, description: 'Permission check result' })
  async checkPermission(
    @Param('userId') userId: string,
    @Param('resource') resource: string,
    @Param('action') action: string,
  ) {
    const hasPermission = await this.roleService.hasPermission(userId, resource, action);
    return { hasPermission };
  }

  @Get('user/:userId/permissions')
  @ApiOperation({ summary: 'Get all permissions for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'List of user permissions' })
  async getUserPermissions(@Param('userId') userId: string) {
    return this.roleService.getUserPermissions(userId);
  }

  // ==================== INITIALIZATION ====================

  @Post('initialize')
  @Roles('OWNER', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Initialize system roles for the workspace' })
  @ApiResponse({ status: 204, description: 'System roles initialized' })
  async initializeWorkspaceRoles() {
    const workspaceId = (this.roleService as any).getWorkspaceIdOrThrow();
    await this.roleService.initializeWorkspaceRoles(workspaceId);
  }
}

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available permissions' })
  @ApiResponse({ status: 200, description: 'List of permissions' })
  async findAllPermissions() {
    return this.roleService.findAllPermissions();
  }

  @Get('by-resource/:resource')
  @ApiOperation({ summary: 'Get permissions for a specific resource' })
  @ApiParam({ name: 'resource', description: 'Resource type' })
  @ApiResponse({ status: 200, description: 'List of permissions' })
  async findPermissionsByResource(@Param('resource') resource: string) {
    return this.roleService.findPermissionsByResource(resource);
  }

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Create a new permission (admin only)' })
  @ApiResponse({ status: 201, description: 'Permission created successfully' })
  @ApiResponse({ status: 409, description: 'Permission already exists' })
  async createPermission(@Body() dto: CreatePermissionDto) {
    return this.roleService.createPermission(dto);
  }

  @Post('ensure-standard')
  @Roles('OWNER', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Ensure all standard permissions exist' })
  @ApiResponse({ status: 204, description: 'Standard permissions ensured' })
  async ensureStandardPermissions() {
    await this.roleService.ensureStandardPermissions();
  }
}
