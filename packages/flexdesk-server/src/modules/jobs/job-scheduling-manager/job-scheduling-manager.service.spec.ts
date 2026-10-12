import { JobSchedulingManagerService } from './job-scheduling-manager.service';

describe('JobSchedulingManagerService', () => {
  let service: JobSchedulingManagerService;

  const mockWorkspaceId = 'workspace-1';
  const mockJobId = 'job-1';
  const mockTechnicianId = 'tech-1';

  const mockPrisma = {
    job: {
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    technician: {
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new JobSchedulingManagerService(mockPrisma as any);
  });

  // -----------------------------------------------------------------------
  // scheduleJob
  // -----------------------------------------------------------------------
  describe('scheduleJob', () => {
    it('schedules a job with date, time, and technician', async () => {
      const scheduled = {
        id: mockJobId,
        status: 'SCHEDULED',
        scheduledDate: '2025-06-15',
        scheduledStartTime: '09:00',
        technicianId: mockTechnicianId,
      };
      mockPrisma.job.update.mockResolvedValue(scheduled);

      const result = await service.scheduleJob({
        jobId: mockJobId,
        scheduledDate: '2025-06-15',
        scheduledStartTime: '09:00',
        technicianId: mockTechnicianId,
        workspaceId: mockWorkspaceId,
      });

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId, workspaceId: mockWorkspaceId },
        data: {
          scheduledDate: '2025-06-15',
          scheduledStartTime: '09:00',
          scheduledAt: expect.any(Date),
          technicianId: mockTechnicianId,
          status: 'SCHEDULED',
        },
      });
      expect(result.status).toBe('SCHEDULED');
    });
  });

  // -----------------------------------------------------------------------
  // rescheduleJob
  // -----------------------------------------------------------------------
  describe('rescheduleJob', () => {
    it('reschedules a job to a new date/time', async () => {
      mockPrisma.job.update.mockResolvedValue({
        id: mockJobId,
        scheduledDate: '2025-06-20',
        scheduledStartTime: '14:00',
      });

      const result = await service.rescheduleJob({
        jobId: mockJobId,
        newDate: '2025-06-20',
        newStartTime: '14:00',
        workspaceId: mockWorkspaceId,
        reason: 'Customer requested change',
      });

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId, workspaceId: mockWorkspaceId },
        data: {
          scheduledDate: '2025-06-20',
          scheduledStartTime: '14:00',
          scheduledAt: expect.any(Date),
        },
      });
      expect(result.scheduledDate).toBe('2025-06-20');
    });
  });

  // -----------------------------------------------------------------------
  // getAvailableSlots
  // -----------------------------------------------------------------------
  describe('getAvailableSlots', () => {
    it('returns full day when no jobs are scheduled', async () => {
      mockPrisma.job.findMany.mockResolvedValue([]);

      const slots = await service.getAvailableSlots({
        technicianId: mockTechnicianId,
        date: '2025-06-15',
        workspaceId: mockWorkspaceId,
      });

      expect(slots).toEqual([
        {
          startTime: '08:00',
          endTime: '18:00',
          technicianId: mockTechnicianId,
        },
      ]);
    });

    it('finds gaps between scheduled jobs', async () => {
      mockPrisma.job.findMany.mockResolvedValue([
        {
          scheduledStartTime: '09:00',
          scheduledEndTime: '10:30',
          estimatedDuration: 90,
        },
        {
          scheduledStartTime: '13:00',
          scheduledEndTime: '14:00',
          estimatedDuration: 60,
        },
      ]);

      const slots = await service.getAvailableSlots({
        technicianId: mockTechnicianId,
        date: '2025-06-15',
        workspaceId: mockWorkspaceId,
      });

      expect(slots).toEqual([
        { startTime: '08:00', endTime: '09:00', technicianId: mockTechnicianId },
        { startTime: '10:30', endTime: '13:00', technicianId: mockTechnicianId },
        { startTime: '14:00', endTime: '18:00', technicianId: mockTechnicianId },
      ]);
    });

    it('uses estimatedDuration when scheduledEndTime is missing', async () => {
      mockPrisma.job.findMany.mockResolvedValue([
        {
          scheduledStartTime: '10:00',
          scheduledEndTime: null,
          estimatedDuration: 120, // 2 hours
        },
      ]);

      const slots = await service.getAvailableSlots({
        technicianId: mockTechnicianId,
        date: '2025-06-15',
        workspaceId: mockWorkspaceId,
      });

      expect(slots).toEqual([
        { startTime: '08:00', endTime: '10:00', technicianId: mockTechnicianId },
        { startTime: '12:00', endTime: '18:00', technicianId: mockTechnicianId },
      ]);
    });

    it('queries all available technicians when no technicianId is given', async () => {
      mockPrisma.technician.findMany.mockResolvedValue([
        { id: 'tech-a' },
        { id: 'tech-b' },
      ]);
      // Each technician has no jobs
      mockPrisma.job.findMany.mockResolvedValue([]);

      const slots = await service.getAvailableSlots({
        date: '2025-06-15',
        workspaceId: mockWorkspaceId,
      });

      expect(mockPrisma.technician.findMany).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspaceId, isAvailable: true },
        select: { id: true },
      });
      // Two technicians, each with full day slot
      expect(slots).toHaveLength(2);
      expect(slots[0].technicianId).toBe('tech-a');
      expect(slots[1].technicianId).toBe('tech-b');
    });
  });

  // -----------------------------------------------------------------------
  // suggestTechnician
  // -----------------------------------------------------------------------
  describe('suggestTechnician', () => {
    it('returns empty array when job is not found', async () => {
      mockPrisma.job.findUnique.mockResolvedValue(null);

      const result = await service.suggestTechnician({
        jobId: mockJobId,
        workspaceId: mockWorkspaceId,
      });

      expect(result).toEqual([]);
    });

    it('returns empty array when no technicians are available', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: mockJobId,
        scheduledDate: '2025-06-15',
        scheduledStartTime: '09:00',
        scheduledEndTime: '10:00',
        location: null,
        property: null,
      });
      mockPrisma.technician.findMany.mockResolvedValue([]);

      const result = await service.suggestTechnician({
        jobId: mockJobId,
        workspaceId: mockWorkspaceId,
      });

      expect(result).toEqual([]);
    });

    it('ranks technicians by score (no conflicts + low workload = higher)', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: mockJobId,
        scheduledDate: '2025-06-15',
        scheduledStartTime: '09:00',
        scheduledEndTime: '10:00',
        location: null,
        property: null,
      });

      mockPrisma.technician.findMany.mockResolvedValue([
        {
          id: 'tech-busy',
          currentLocation: null,
          user: { firstName: 'Busy', lastName: 'Tech' },
        },
        {
          id: 'tech-free',
          currentLocation: null,
          user: { firstName: 'Free', lastName: 'Tech' },
        },
      ]);

      // tech-busy has 5 active jobs, tech-free has 0
      mockPrisma.job.groupBy.mockResolvedValue([
        { technicianId: 'tech-busy', _count: { id: 5 } },
      ]);

      // No time-slot conflicts
      mockPrisma.job.findMany.mockResolvedValue([]);

      const result = await service.suggestTechnician({
        jobId: mockJobId,
        workspaceId: mockWorkspaceId,
      });

      expect(result.length).toBe(2);
      // tech-free should have higher score (no conflict + 0 active jobs)
      const freeIdx = result.findIndex((r) => r.technicianId === 'tech-free');
      const busyIdx = result.findIndex((r) => r.technicianId === 'tech-busy');
      expect(result[freeIdx].score).toBeGreaterThan(result[busyIdx].score);
      expect(result[freeIdx].activeJobCount).toBe(0);
      expect(result[busyIdx].activeJobCount).toBe(5);
    });

    it('deducts score for time-slot conflicts', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: mockJobId,
        scheduledDate: '2025-06-15',
        scheduledStartTime: '09:00',
        scheduledEndTime: '10:00',
        location: null,
        property: null,
      });

      mockPrisma.technician.findMany.mockResolvedValue([
        {
          id: 'tech-conflict',
          currentLocation: null,
          user: { firstName: 'Conflict', lastName: 'Tech' },
        },
        {
          id: 'tech-clear',
          currentLocation: null,
          user: { firstName: 'Clear', lastName: 'Tech' },
        },
      ]);

      mockPrisma.job.groupBy.mockResolvedValue([]);

      // tech-conflict has overlapping job at 09:00-10:00
      mockPrisma.job.findMany.mockResolvedValue([
        {
          technicianId: 'tech-conflict',
          scheduledStartTime: '08:30',
          scheduledEndTime: '09:30',
          estimatedDuration: 60,
        },
      ]);

      const result = await service.suggestTechnician({
        jobId: mockJobId,
        workspaceId: mockWorkspaceId,
      });

      const conflictTech = result.find(
        (r) => r.technicianId === 'tech-conflict',
      );
      const clearTech = result.find((r) => r.technicianId === 'tech-clear');

      // tech-clear should score higher because they get the +40 no-conflict bonus
      expect(clearTech!.score).toBeGreaterThan(conflictTech!.score);
    });
  });

  // -----------------------------------------------------------------------
  // autoAssignTechnician
  // -----------------------------------------------------------------------
  describe('autoAssignTechnician', () => {
    it('returns top suggestion', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: mockJobId,
        scheduledDate: '2025-06-15',
        scheduledStartTime: '09:00',
        scheduledEndTime: '10:00',
        location: null,
        property: null,
      });

      mockPrisma.technician.findMany.mockResolvedValue([
        {
          id: 'tech-a',
          currentLocation: null,
          user: { firstName: 'A', lastName: 'Tech' },
        },
      ]);
      mockPrisma.job.groupBy.mockResolvedValue([]);
      mockPrisma.job.findMany.mockResolvedValue([]);

      const result = await service.autoAssignTechnician({
        jobId: mockJobId,
        workspaceId: mockWorkspaceId,
      });

      expect(result).toBeDefined();
      expect(result!.technicianId).toBe('tech-a');
    });

    it('returns null when no technicians are available', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: mockJobId,
        scheduledDate: '2025-06-15',
        scheduledStartTime: '09:00',
        scheduledEndTime: null,
        location: null,
        property: null,
      });
      mockPrisma.technician.findMany.mockResolvedValue([]);

      const result = await service.autoAssignTechnician({
        jobId: mockJobId,
        workspaceId: mockWorkspaceId,
      });

      expect(result).toBeNull();
    });
  });
});
