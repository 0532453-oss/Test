import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { type Workspace, type WorkspaceMember } from '@prisma/client';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AuthenticatedUser } from '../auth/strategies/jwt.strategy';

import { type AddMemberDto } from './dto/add-member.dto';
import { type CreateWorkspaceDto } from './dto/create-workspace.dto';
import { type UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { type UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceService } from './workspace.service';

@ApiTags('workspaces')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created' })
  @ApiResponse({ status: 409, description: 'Subdomain already taken' })
  async create(
    @Body() dto: CreateWorkspaceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Workspace> {
    return this.workspaceService.createWorkspace(dto, user.id);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get workspaces for current user' })
  @ApiResponse({ status: 200, description: 'List of user workspaces' })
  async getMyWorkspaces(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Workspace[]> {
    return this.workspaceService.getUserWorkspaces(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace by ID' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Workspace found' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Workspace> {
    return this.workspaceService.getWorkspaceById(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get workspace statistics' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Workspace statistics' })
  async getStats(@Param('id', ParseUUIDPipe) id: string): Promise<{
    totalJobs: number;
    completedJobs: number;
    activeJobs: number;
    totalCustomers: number;
    totalTechnicians: number;
    totalRevenue: number;
  }> {
    return this.workspaceService.getWorkspaceStats(id);
  }

  @Put(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update workspace' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Workspace updated' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkspaceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Workspace> {
    return this.workspaceService.updateWorkspace(id, dto, user.id);
  }

  @Post(':id/members')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Add member to workspace' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'Member added' })
  @ApiResponse({ status: 409, description: 'User already a member' })
  async addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WorkspaceMember> {
    return this.workspaceService.addMember(id, dto, user.id);
  }

  @Delete(':id/members/:memberId')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Remove member from workspace' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiParam({ name: 'memberId', description: 'Member UUID' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.workspaceService.removeMember(id, memberId, user.id);
  }

  @Put(':id/members/:memberId/role')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update member role' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiParam({ name: 'memberId', description: 'Member UUID' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  async updateMemberRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WorkspaceMember> {
    return this.workspaceService.updateMemberRole(id, memberId, dto.role, user.id);
  }
}
