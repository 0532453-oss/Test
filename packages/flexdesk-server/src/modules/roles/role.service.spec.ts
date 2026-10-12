import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { RoleService, RESOURCES, ACTIONS, SYSTEM_ROLES } from './role.service';

import { PrismaService } from '@/core/database/prisma.service';
import * as workspaceContext from '@/core/database/workspace-context';

// Mock workspace context
jest.mock('@/core/database/workspace-context', () => ({
  getWorkspaceId: jest.fn(),
}));

describe('RoleService', () => {
  let service: RoleService;
  let prisma: PrismaService;

  const mockWorkspaceId = 'workspace-123';
  const mockRoleId = 'role-123';
  const mockPermissionId = 'permission-123';
  const mockUserId = 'user-123';
  const mockMemberId = 'member-123';

  const mockRole = {
    id: mockRoleId,
    workspaceId: mockWorkspaceId,
    name: 'Custom Role',
    description: 'A custom role',
    isSystem: false,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPermission = {
    id: mockPermissionId,
    resource: 'jobs',
    action: 'read',
    description: 'Read jobs',
    createdAt: new Date(),
  };

  const mockRolePermission = {
    id: 'role-permission-123',
    roleId: mockRoleId,
    permissionId: mockPermissionId,
    scope: null,
    conditions: null,
    createdAt: new Date(),
    permission: mockPermission,
  };

  const mockRoleWithPermissions = {
    ...mockRole,
    permissions: [mockRolePermission],
  };

  const mockMember = {
    id: mockMemberId,
    workspaceId: mockWorkspaceId,
    userId: mockUserId,
    role: 'MEMBER',
    roleId: mockRoleId,
    createdAt: new Date(),
  };

  // Mock PrismaService
  const mockPrismaService: any = {
    role: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    permission: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    rolePermission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((fn: (prisma: any) => any) => fn(mockPrismaService)),
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Set workspace context
    (workspaceContext.getWorkspaceId as jest.Mock).mockReturnValue(mockWorkspaceId);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createRole', () => {
    it('should create a new role successfully', async () => {
      mockPrismaService.role.findUnique.mockResolvedValueOnce(null); // duplicate check
      mockPrismaService.role.create.mockResolvedValue(mockRole);
      mockPrismaService.role.findUnique.mockResolvedValueOnce(mockRoleWithPermissions); // return created role in transaction

      const result = await service.createRole({
        name: 'Custom Role',
        description: 'A custom role',
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Custom Role');
    });

    it('should throw ConflictException if role name already exists', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);

      await expect(
        service.createRole({ name: 'Custom Role' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should unset other defaults when creating a default role', async () => {
      mockPrismaService.role.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.role.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.role.create.mockResolvedValue({ ...mockRole, isDefault: true });
      mockPrismaService.role.findUnique.mockResolvedValue({
        ...mockRoleWithPermissions,
        isDefault: true,
      });

      const result = await service.createRole({
        name: 'Default Role',
        isDefault: true,
      });

      expect(mockPrismaService.role.updateMany).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspaceId, isDefault: true },
        data: { isDefault: false },
      });
      expect(result.isDefault).toBe(true);
    });

    it('should require workspace context', async () => {
      (workspaceContext.getWorkspaceId as jest.Mock).mockReturnValue(null);

      await expect(
        service.createRole({ name: 'Test Role' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllRoles', () => {
    it('should return all roles in workspace', async () => {
      mockPrismaService.role.findMany.mockResolvedValue([mockRoleWithPermissions]);

      const result = await service.findAllRoles();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Custom Role');
    });
  });

  describe('findRoleById', () => {
    it('should return role by ID', async () => {
      mockPrismaService.role.findFirst.mockResolvedValue(mockRoleWithPermissions);

      const result = await service.findRoleById(mockRoleId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockRoleId);
    });

    it('should throw NotFoundException if role not found', async () => {
      mockPrismaService.role.findFirst.mockResolvedValue(null);

      await expect(service.findRoleById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findRoleByName', () => {
    it('should return role by name', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockRoleWithPermissions);

      const result = await service.findRoleByName('Custom Role');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Custom Role');
    });

    it('should return null if role not found', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      const result = await service.findRoleByName('Nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateRole', () => {
    it('should update a role successfully', async () => {
      const updatedRole = { ...mockRoleWithPermissions, name: 'Updated Role' };
      mockPrismaService.role.findFirst.mockResolvedValue(mockRoleWithPermissions);
      mockPrismaService.role.findUnique.mockResolvedValueOnce(null); // No name conflict
      mockPrismaService.role.update.mockResolvedValue(updatedRole);
      mockPrismaService.role.findUnique.mockResolvedValue(updatedRole);

      const result = await service.updateRole(mockRoleId, {
        name: 'Updated Role',
      });

      expect(result.name).toBe('Updated Role');
    });

    it('should throw BadRequestException when modifying system role name', async () => {
      const systemRole = { ...mockRoleWithPermissions, isSystem: true };
      mockPrismaService.role.findFirst.mockResolvedValue(systemRole);

      await expect(
        service.updateRole(mockRoleId, { name: 'New Name' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if new name already exists', async () => {
      mockPrismaService.role.findFirst.mockResolvedValue(mockRoleWithPermissions);
      mockPrismaService.role.findUnique.mockResolvedValue({ id: 'other-role' });

      await expect(
        service.updateRole(mockRoleId, { name: 'Existing Name' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteRole', () => {
    it('should delete a role successfully', async () => {
      mockPrismaService.role.findFirst.mockResolvedValue(mockRoleWithPermissions);
      mockPrismaService.workspaceMember.count.mockResolvedValue(0);
      mockPrismaService.role.delete.mockResolvedValue(mockRole);

      const result = await service.deleteRole(mockRoleId);

      expect(result).toBeDefined();
      expect(mockPrismaService.role.delete).toHaveBeenCalled();
    });

    it('should throw BadRequestException when deleting system role', async () => {
      const systemRole = { ...mockRoleWithPermissions, isSystem: true };
      mockPrismaService.role.findFirst.mockResolvedValue(systemRole);

      await expect(service.deleteRole(mockRoleId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when role has assigned members', async () => {
      mockPrismaService.role.findFirst.mockResolvedValue(mockRoleWithPermissions);
      mockPrismaService.workspaceMember.count.mockResolvedValue(3);

      await expect(service.deleteRole(mockRoleId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAllPermissions', () => {
    it('should return all permissions', async () => {
      mockPrismaService.permission.findMany.mockResolvedValue([mockPermission]);

      const result = await service.findAllPermissions();

      expect(result).toHaveLength(1);
      expect(result[0].resource).toBe('jobs');
    });
  });

  describe('createPermission', () => {
    it('should create a new permission', async () => {
      mockPrismaService.permission.findUnique.mockResolvedValue(null);
      mockPrismaService.permission.create.mockResolvedValue(mockPermission);

      const result = await service.createPermission({
        resource: 'jobs',
        action: 'read',
        description: 'Read jobs',
      });

      expect(result.resource).toBe('jobs');
      expect(result.action).toBe('read');
    });

    it('should throw ConflictException if permission already exists', async () => {
      mockPrismaService.permission.findUnique.mockResolvedValue(mockPermission);

      await expect(
        service.createPermission({ resource: 'jobs', action: 'read' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('addPermissionToRole', () => {
    it('should add permission to role', async () => {
      mockPrismaService.role.findFirst.mockResolvedValue(mockRoleWithPermissions);
      mockPrismaService.permission.findUnique.mockResolvedValue(mockPermission);
      mockPrismaService.rolePermission.findUnique.mockResolvedValue(null);
      mockPrismaService.rolePermission.create.mockResolvedValue(mockRolePermission);

      const result = await service.addPermissionToRole(mockRoleId, mockPermissionId);

      expect(result).toBeDefined();
      expect(mockPrismaService.rolePermission.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if permission already assigned', async () => {
      mockPrismaService.role.findFirst.mockResolvedValue(mockRoleWithPermissions);
      mockPrismaService.permission.findUnique.mockResolvedValue(mockPermission);
      mockPrismaService.rolePermission.findUnique.mockResolvedValue(mockRolePermission);

      await expect(
        service.addPermissionToRole(mockRoleId, mockPermissionId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('assignRoleToMember', () => {
    it('should assign role to member', async () => {
      mockPrismaService.workspaceMember.findFirst.mockResolvedValue(mockMember);
      mockPrismaService.role.findFirst.mockResolvedValue(mockRoleWithPermissions);
      mockPrismaService.workspaceMember.update.mockResolvedValue({
        ...mockMember,
        roleId: mockRoleId,
      });

      await service.assignRoleToMember(mockMemberId, mockRoleId);

      expect(mockPrismaService.workspaceMember.update).toHaveBeenCalledWith({
        where: { id: mockMemberId },
        data: { roleId: mockRoleId },
      });
    });

    it('should throw NotFoundException if member not found', async () => {
      mockPrismaService.workspaceMember.findFirst.mockResolvedValue(null);

      await expect(
        service.assignRoleToMember('nonexistent', mockRoleId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('hasPermission', () => {
    it('should return true if user has exact permission', async () => {
      const memberWithRole = {
        ...mockMember,
        roleRef: mockRoleWithPermissions,
      };
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue(memberWithRole);

      const result = await service.hasPermission(mockUserId, 'jobs', 'read');

      expect(result).toBe(true);
    });

    it('should return true if user has manage permission for resource', async () => {
      const memberWithManage = {
        ...mockMember,
        roleRef: {
          ...mockRole,
          permissions: [
            {
              ...mockRolePermission,
              permission: { ...mockPermission, action: 'manage' },
            },
          ],
        },
      };
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue(memberWithManage);

      const result = await service.hasPermission(mockUserId, 'jobs', 'create');

      expect(result).toBe(true);
    });

    it('should return false if user does not have permission', async () => {
      const memberWithRole = {
        ...mockMember,
        roleRef: mockRoleWithPermissions,
      };
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue(memberWithRole);

      const result = await service.hasPermission(mockUserId, 'invoices', 'delete');

      expect(result).toBe(false);
    });

    it('should return false if member not found', async () => {
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue(null);

      const result = await service.hasPermission('nonexistent', 'jobs', 'read');

      expect(result).toBe(false);
    });

    it('should fall back to legacy role check if no roleRef', async () => {
      const memberWithLegacyRole = {
        ...mockMember,
        role: 'OWNER',
        roleRef: null,
      };
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue(memberWithLegacyRole);

      const result = await service.hasPermission(mockUserId, 'jobs', 'manage');

      expect(result).toBe(true);
    });
  });

  describe('getUserPermissions', () => {
    it('should return all permissions for a user', async () => {
      const memberWithRole = {
        ...mockMember,
        roleRef: mockRoleWithPermissions,
      };
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue(memberWithRole);

      const result = await service.getUserPermissions(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].resource).toBe('jobs');
      expect(result[0].action).toBe('read');
    });

    it('should return empty array if member has no role', async () => {
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue({
        ...mockMember,
        roleRef: null,
      });

      const result = await service.getUserPermissions(mockUserId);

      expect(result).toHaveLength(0);
    });
  });

  describe('initializeWorkspaceRoles', () => {
    it('should create system roles for workspace', async () => {
      mockPrismaService.permission.findUnique.mockResolvedValue(null);
      mockPrismaService.permission.create.mockResolvedValue(mockPermission);
      mockPrismaService.role.findUnique.mockResolvedValue(null);
      mockPrismaService.role.create.mockResolvedValue(mockRole);
      mockPrismaService.rolePermission.create.mockResolvedValue(mockRolePermission);

      await service.initializeWorkspaceRoles(mockWorkspaceId);

      // Should have created roles for each system role
      expect(mockPrismaService.role.create).toHaveBeenCalledTimes(
        Object.keys(SYSTEM_ROLES).length,
      );
    });

    it('should skip existing roles during initialization', async () => {
      mockPrismaService.permission.findUnique.mockResolvedValue(mockPermission); // Permissions exist
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole); // Role exists

      await service.initializeWorkspaceRoles(mockWorkspaceId);

      expect(mockPrismaService.role.create).not.toHaveBeenCalled();
    });
  });

  describe('ensureStandardPermissions', () => {
    it('should create all standard permissions', async () => {
      mockPrismaService.permission.findUnique.mockResolvedValue(null);
      mockPrismaService.permission.create.mockResolvedValue(mockPermission);

      await service.ensureStandardPermissions();

      // Should have created permissions for each resource/action combination
      const expectedCount = RESOURCES.length * ACTIONS.length;
      expect(mockPrismaService.permission.create).toHaveBeenCalledTimes(expectedCount);
    });

    it('should skip existing permissions', async () => {
      mockPrismaService.permission.findUnique.mockResolvedValue(mockPermission);

      await service.ensureStandardPermissions();

      expect(mockPrismaService.permission.create).not.toHaveBeenCalled();
    });
  });

  describe('getDefaultRole', () => {
    it('should return default role', async () => {
      const defaultRole = { ...mockRoleWithPermissions, isDefault: true };
      mockPrismaService.role.findFirst.mockResolvedValue(defaultRole);

      const result = await service.getDefaultRole();

      expect(result).toBeDefined();
      expect(result?.isDefault).toBe(true);
    });

    it('should return null if no default role', async () => {
      mockPrismaService.role.findFirst.mockResolvedValue(null);

      const result = await service.getDefaultRole();

      expect(result).toBeNull();
    });
  });

  describe('getMembersByRole', () => {
    it('should return members with specific role', async () => {
      const membersWithRole = [
        {
          ...mockMember,
          user: { id: mockUserId, email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        },
      ];
      mockPrismaService.role.findFirst.mockResolvedValue(mockRoleWithPermissions);
      mockPrismaService.workspaceMember.findMany.mockResolvedValue(membersWithRole);

      const result = await service.getMembersByRole(mockRoleId);

      expect(result).toHaveLength(1);
      expect(result[0].user.email).toBe('test@test.com');
    });
  });

  describe('removeRoleFromMember', () => {
    it('should remove role from member', async () => {
      mockPrismaService.workspaceMember.findFirst.mockResolvedValue(mockMember);
      mockPrismaService.workspaceMember.update.mockResolvedValue({
        ...mockMember,
        roleId: null,
      });

      await service.removeRoleFromMember(mockMemberId);

      expect(mockPrismaService.workspaceMember.update).toHaveBeenCalledWith({
        where: { id: mockMemberId },
        data: { roleId: null },
      });
    });
  });

  describe('removePermissionFromRole', () => {
    it('should remove permission from role', async () => {
      mockPrismaService.role.findFirst.mockResolvedValue(mockRoleWithPermissions);
      mockPrismaService.rolePermission.delete.mockResolvedValue(mockRolePermission);

      await service.removePermissionFromRole(mockRoleId, mockPermissionId);

      expect(mockPrismaService.rolePermission.delete).toHaveBeenCalled();
    });

    it('should throw BadRequestException for system roles', async () => {
      const systemRole = { ...mockRoleWithPermissions, isSystem: true };
      mockPrismaService.role.findFirst.mockResolvedValue(systemRole);

      await expect(
        service.removePermissionFromRole(mockRoleId, mockPermissionId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
