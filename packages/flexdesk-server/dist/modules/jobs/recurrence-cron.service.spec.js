"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
const testing_1 = require("@nestjs/testing");
const recurrence_cron_service_1 = require("./recurrence-cron.service");
const recurrence_service_1 = require("./recurrence.service");
const prisma_service_1 = require("../../core/database/prisma.service");
const workspaceContext = require("../../core/database/workspace-context");
describe('RecurrenceCronService', () => {
    let service;
    const mockWorkspaceId1 = 'workspace-1';
    const mockWorkspaceId2 = 'workspace-2';
    const mockPrismaService = {
        workspace: {
            findMany: jest.fn(),
        },
    };
    const mockRecurrenceService = {
        generateRecurringJobs: jest.fn(),
    };
    const mockConfigService = {
        get: jest.fn(),
    };
    beforeEach(async () => {
        jest.spyOn(workspaceContext, 'runWithWorkspace').mockImplementation((_workspaceId, callback) => {
            return callback();
        });
        const module = await testing_1.Test.createTestingModule({
            providers: [
                recurrence_cron_service_1.RecurrenceCronService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: recurrence_service_1.RecurrenceService, useValue: mockRecurrenceService },
                { provide: config_1.ConfigService, useValue: mockConfigService },
            ],
        }).compile();
        service = module.get(recurrence_cron_service_1.RecurrenceCronService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('onModuleInit', () => {
        it('should enable cron by default', () => {
            mockConfigService.get.mockReturnValue(undefined);
            service.onModuleInit();
            expect(service.isCronEnabled()).toBe(true);
        });
        it('should disable cron when RECURRENCE_CRON_ENABLED is false', () => {
            mockConfigService.get.mockReturnValue('false');
            service.onModuleInit();
            expect(service.isCronEnabled()).toBe(false);
        });
        it('should enable cron when RECURRENCE_CRON_ENABLED is true', () => {
            mockConfigService.get.mockReturnValue('true');
            service.onModuleInit();
            expect(service.isCronEnabled()).toBe(true);
        });
    });
    describe('handleRecurringJobGeneration', () => {
        it('should skip processing when cron is disabled', async () => {
            service.setCronEnabled(false);
            await service.handleRecurringJobGeneration();
            expect(mockPrismaService.workspace.findMany).not.toHaveBeenCalled();
        });
        it('should process all workspaces when cron is enabled', async () => {
            service.setCronEnabled(true);
            mockPrismaService.workspace.findMany.mockResolvedValue([
                { id: mockWorkspaceId1 },
                { id: mockWorkspaceId2 },
            ]);
            mockRecurrenceService.generateRecurringJobs.mockResolvedValue({
                generated: 2,
                skipped: 1,
                errors: [],
            });
            await service.handleRecurringJobGeneration();
            expect(mockPrismaService.workspace.findMany).toHaveBeenCalled();
            expect(mockRecurrenceService.generateRecurringJobs).toHaveBeenCalledTimes(2);
        });
    });
    describe('processAllWorkspaces', () => {
        it('should return aggregated results from all workspaces', async () => {
            mockPrismaService.workspace.findMany.mockResolvedValue([
                { id: mockWorkspaceId1 },
                { id: mockWorkspaceId2 },
            ]);
            mockRecurrenceService.generateRecurringJobs
                .mockResolvedValueOnce({
                generated: 3,
                skipped: 1,
                errors: [],
            })
                .mockResolvedValueOnce({
                generated: 2,
                skipped: 0,
                errors: [{ templateId: 'template-1', error: 'Test error' }],
            });
            const result = await service.processAllWorkspaces();
            expect(result.workspacesProcessed).toBe(2);
            expect(result.totalGenerated).toBe(5);
            expect(result.totalSkipped).toBe(1);
            expect(result.totalErrors).toBe(1);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toEqual({
                workspaceId: mockWorkspaceId2,
                templateId: 'template-1',
                error: 'Test error',
            });
        });
        it('should handle empty workspace list', async () => {
            mockPrismaService.workspace.findMany.mockResolvedValue([]);
            const result = await service.processAllWorkspaces();
            expect(result.workspacesProcessed).toBe(0);
            expect(result.totalGenerated).toBe(0);
            expect(result.totalSkipped).toBe(0);
            expect(result.totalErrors).toBe(0);
            expect(result.errors).toHaveLength(0);
        });
        it('should handle workspace processing errors gracefully', async () => {
            mockPrismaService.workspace.findMany.mockResolvedValue([
                { id: mockWorkspaceId1 },
            ]);
            mockRecurrenceService.generateRecurringJobs.mockRejectedValue(new Error('Database connection failed'));
            const result = await service.processAllWorkspaces();
            expect(result.workspacesProcessed).toBe(1);
            expect(result.totalErrors).toBe(1);
            expect(result.errors[0]).toEqual({
                workspaceId: mockWorkspaceId1,
                templateId: 'N/A',
                error: 'Database connection failed',
            });
        });
    });
    describe('triggerManualRun', () => {
        it('should call processAllWorkspaces', async () => {
            mockPrismaService.workspace.findMany.mockResolvedValue([]);
            const result = await service.triggerManualRun();
            expect(mockPrismaService.workspace.findMany).toHaveBeenCalled();
            expect(result.workspacesProcessed).toBe(0);
        });
    });
    describe('setCronEnabled', () => {
        it('should enable cron', () => {
            service.setCronEnabled(false);
            expect(service.isCronEnabled()).toBe(false);
            service.setCronEnabled(true);
            expect(service.isCronEnabled()).toBe(true);
        });
        it('should disable cron', () => {
            service.setCronEnabled(true);
            expect(service.isCronEnabled()).toBe(true);
            service.setCronEnabled(false);
            expect(service.isCronEnabled()).toBe(false);
        });
    });
});
