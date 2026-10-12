import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { WorkspaceService } from './workspace.service';

import { PrismaService } from '@/core/database/prisma.service';

describe('WorkspaceService', () => {
  let service: WorkspaceService;

  const mockOwnerId = 'user-owner-123';
  const mockAdminId = 'user-admin-456';
  const mockMemberId = 'user-member-789';
  const mockWorkspaceId = 'workspace-123';
  const mockMemberRecordId = 'member-record-123';

  const mockWorkspace = {
    id: mockWorkspaceId,
    name: 'Test Workspace',
    subdomain: 'test-workspace',
    members: [
      {
        id: 'wm-1',
        userId: mockOwnerId,
        workspaceId: mockWorkspaceId,
        role: 'OWNER',
        user: { id: mockOwnerId, firstName: 'Owner', lastName: 'User' },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    workspace: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    job: {
      count: jest.fn(),
    },
    customer: {
      count: jest.fn(),
    },
    technician: {
      count: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<WorkspaceService>(WorkspaceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWorkspace', () => {
    it('should create a new workspace with owner', async () => {
      mockPrismaService.workspace.findUnique.mockResolvedValue(null);
      mockPrismaService.workspace.create.mockResolvedValue(mockWorkspace);

      const result = await service.createWorkspace(
        { name: 'Test Workspace', subdomain: 'test-workspace' },
        mockOwnerId,
      );

      expect(result).toEqual(mockWorkspace);
      expect(mockPrismaService.workspace.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Workspace',
            subdomain: 'test-workspace',
            members: {
              create: { userId: mockOwnerId, role: 'OWNER' },
            },
          }),
        }),
      );
    });

    it('should throw ConflictException when subdomain is taken', async () => {
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);

      await expect(
        service.createWorkspace(
          { name: 'Another', subdomain: 'test-workspace' },
          mockOwnerId,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getWorkspaceById', () => {
    it('should return workspace when found', async () => {
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);

      const result = await service.getWorkspaceById(mockWorkspaceId);

      expect(result).toEqual(mockWorkspace);
    });

    it('should throw NotFoundException when workspace not found', async () => {
      mockPrismaService.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.getWorkspaceById('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getWorkspaceBySubdomain', () => {
    it('should return workspace when found', async () => {
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);

      const result = await service.getWorkspaceBySubdomain('test-workspace');

      expect(result).toEqual(mockWorkspace);
    });

    it('should throw NotFoundException when subdomain not found', async () => {
      mockPrismaService.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.getWorkspaceBySubdomain('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserWorkspaces', () => {
    it('should return workspaces for a user', async () => {
      mockPrismaService.workspaceMember.findMany.mockResolvedValue([
        { workspace: mockWorkspace },
      ]);

      const result = await service.getUserWorkspaces(mockOwnerId);

      expect(result).toEqual([mockWorkspace]);
    });

    it('should return empty array when user has no workspaces', async () => {
      mockPrismaService.workspaceMember.findMany.mockResolvedValue([]);

      const result = await service.getUserWorkspaces('no-workspaces-user');

      expect(result).toEqual([]);
    });
  });

  describe('updateWorkspace', () => {
    it('should update workspace name when user has permission', async () => {
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue({
        role: 'OWNER',
      });
      mockPrismaService.workspace.update.mockResolvedValue({
        ...mockWorkspace,
        name: 'Updated Name',
      });

      const result = await service.updateWorkspace(
        mockWorkspaceId,
        { name: 'Updated Name' },
        mockOwnerId,
      );

      expect(result.name).toBe('Updated Name');
    });

    it('should throw ForbiddenException when user is not owner/admin', async () => {
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue({
        role: 'MEMBER',
      });

      await expect(
        service.updateWorkspace(
          mockWorkspaceId,
          { name: 'New Name' },
          mockMemberId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when new subdomain is taken', async () => {
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue({
        role: 'OWNER',
      });
      mockPrismaService.workspace.findFirst.mockResolvedValue({
        id: 'other-workspace',
      });

      await expect(
        service.updateWorkspace(
          mockWorkspaceId,
          { subdomain: 'taken-subdomain' },
          mockOwnerId,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('addMember', () => {
    it('should add a member with the given role', async () => {
      const newMember = {
        id: mockMemberRecordId,
        workspaceId: mockWorkspaceId,
        userId: mockMemberId,
        role: 'MEMBER',
        user: { id: mockMemberId },
      };

      mockPrismaService.workspaceMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' })  // requireRole check
        .mockResolvedValueOnce(null);               // existing member check
      mockPrismaService.workspaceMember.create.mockResolvedValue(newMember);

      const result = await service.addMember(
        mockWorkspaceId,
        { userId: mockMemberId, role: 'MEMBER' },
        mockOwnerId,
      );

      expect(result).toEqual(newMember);
    });

    it('should throw ConflictException when user is already a member', async () => {
      mockPrismaService.workspaceMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' })         // requireRole check
        .mockResolvedValueOnce({ id: 'existing-member' }); // existing member check

      await expect(
        service.addMember(
          mockWorkspaceId,
          { userId: mockMemberId, role: 'MEMBER' },
          mockOwnerId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException when requester is not admin/owner', async () => {
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue({
        role: 'MEMBER',
      });

      await expect(
        service.addMember(
          mockWorkspaceId,
          { userId: 'new-user', role: 'MEMBER' },
          mockMemberId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeMember', () => {
    it('should remove a member', async () => {
      mockPrismaService.workspaceMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' }) // requireRole check
        .mockResolvedValueOnce({
          id: mockMemberRecordId,
          workspaceId: mockWorkspaceId,
          role: 'MEMBER',
        });
      mockPrismaService.workspaceMember.delete.mockResolvedValue({});

      await service.removeMember(mockWorkspaceId, mockMemberRecordId, mockOwnerId);

      expect(mockPrismaService.workspaceMember.delete).toHaveBeenCalledWith({
        where: { id: mockMemberRecordId },
      });
    });

    it('should throw ForbiddenException when removing owner', async () => {
      mockPrismaService.workspaceMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' }) // requireRole check
        .mockResolvedValueOnce({
          id: mockMemberRecordId,
          workspaceId: mockWorkspaceId,
          role: 'OWNER',
        });

      await expect(
        service.removeMember(mockWorkspaceId, mockMemberRecordId, mockOwnerId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when member not found', async () => {
      mockPrismaService.workspaceMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' }) // requireRole check
        .mockResolvedValueOnce(null);              // member lookup

      await expect(
        service.removeMember(mockWorkspaceId, 'non-existent', mockOwnerId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role when requester is owner', async () => {
      mockPrismaService.workspaceMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' }) // requireRole check
        .mockResolvedValueOnce({
          id: mockMemberRecordId,
          workspaceId: mockWorkspaceId,
          role: 'MEMBER',
        });
      mockPrismaService.workspaceMember.update.mockResolvedValue({
        id: mockMemberRecordId,
        role: 'ADMIN',
        user: { id: mockMemberId },
      });

      const result = await service.updateMemberRole(
        mockWorkspaceId,
        mockMemberRecordId,
        'ADMIN',
        mockOwnerId,
      );

      expect(result.role).toBe('ADMIN');
    });

    it('should throw ForbiddenException when changing owner role', async () => {
      mockPrismaService.workspaceMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' }) // requireRole check
        .mockResolvedValueOnce({
          id: mockMemberRecordId,
          workspaceId: mockWorkspaceId,
          role: 'OWNER',
        });

      await expect(
        service.updateMemberRole(
          mockWorkspaceId,
          mockMemberRecordId,
          'ADMIN',
          mockOwnerId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when requester is not owner', async () => {
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue({
        role: 'ADMIN',
      });

      await expect(
        service.updateMemberRole(
          mockWorkspaceId,
          mockMemberRecordId,
          'ADMIN',
          mockAdminId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getWorkspaceStats', () => {
    it('should return workspace statistics', async () => {
      mockPrismaService.job.count
        .mockResolvedValueOnce(50)  // totalJobs
        .mockResolvedValueOnce(30)  // completedJobs
        .mockResolvedValueOnce(15); // activeJobs
      mockPrismaService.customer.count.mockResolvedValue(20);
      mockPrismaService.technician.count.mockResolvedValue(5);
      mockPrismaService.invoice.findMany.mockResolvedValue([
        { total: 100 },
        { total: 200 },
      ]);

      const result = await service.getWorkspaceStats(mockWorkspaceId);

      expect(result.totalJobs).toBe(50);
      expect(result.completedJobs).toBe(30);
      expect(result.activeJobs).toBe(15);
      expect(result.totalCustomers).toBe(20);
      expect(result.totalTechnicians).toBe(5);
      expect(result.totalRevenue).toBe(300);
    });

    it('should return zero revenue when no paid invoices', async () => {
      mockPrismaService.job.count.mockResolvedValue(0);
      mockPrismaService.customer.count.mockResolvedValue(0);
      mockPrismaService.technician.count.mockResolvedValue(0);
      mockPrismaService.invoice.findMany.mockResolvedValue([]);

      const result = await service.getWorkspaceStats(mockWorkspaceId);

      expect(result.totalRevenue).toBe(0);
    });
  });
});
