import { JobDispatchManagerService } from './job-dispatch-manager.service';

describe('JobDispatchManagerService', () => {
  let service: JobDispatchManagerService;

  const mockWorkspaceId = 'workspace-1';
  const mockJobId = 'job-1';
  const mockTechnicianId = 'tech-1';

  const mockPrisma = {
    job: {
      update: jest.fn(),
      findMany: jest.fn(),
    },
    technician: {
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new JobDispatchManagerService(mockPrisma as any);
  });

  // -----------------------------------------------------------------------
  // dispatchJob — transitions to DISPATCHED
  // -----------------------------------------------------------------------
  describe('dispatchJob', () => {
    it('dispatches a job to a technician (SCHEDULED → DISPATCHED)', async () => {
      const dispatchedJob = {
        id: mockJobId,
        status: 'DISPATCHED',
        technicianId: mockTechnicianId,
        customer: { id: 'c1' },
        property: null,
      };
      mockPrisma.job.update.mockResolvedValue(dispatchedJob);

      const result = await service.dispatchJob({
        jobId: mockJobId,
        technicianId: mockTechnicianId,
        workspaceId: mockWorkspaceId,
      });

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId, workspaceId: mockWorkspaceId },
        data: {
          technicianId: mockTechnicianId,
          status: 'DISPATCHED',
        },
        include: {
          customer: true,
          property: true,
        },
      });
      expect(result.status).toBe('DISPATCHED');
      expect(result.technicianId).toBe(mockTechnicianId);
    });
  });

  // -----------------------------------------------------------------------
  // bulkDispatch
  // -----------------------------------------------------------------------
  describe('bulkDispatch', () => {
    it('dispatches multiple jobs', async () => {
      mockPrisma.job.update.mockResolvedValue({
        id: 'any',
        status: 'DISPATCHED',
      });

      const assignments = [
        { jobId: 'job-1', technicianId: 'tech-1' },
        { jobId: 'job-2', technicianId: 'tech-2' },
        { jobId: 'job-3', technicianId: 'tech-1' },
      ];

      const results = await service.bulkDispatch({
        assignments,
        workspaceId: mockWorkspaceId,
      });

      expect(results).toHaveLength(3);
      expect(mockPrisma.job.update).toHaveBeenCalledTimes(3);
    });
  });

  // -----------------------------------------------------------------------
  // getDispatchBoard
  // -----------------------------------------------------------------------
  describe('getDispatchBoard', () => {
    it('fetches jobs and technicians for a date', async () => {
      const mockJobs = [
        { id: 'job-1', status: 'SCHEDULED' },
        { id: 'job-2', status: 'DISPATCHED' },
      ];
      const mockTechs = [{ id: 'tech-1', isAvailable: true }];

      mockPrisma.job.findMany.mockResolvedValue(mockJobs);
      mockPrisma.technician.findMany.mockResolvedValue(mockTechs);

      const date = new Date('2025-06-15T00:00:00Z');
      const result = await service.getDispatchBoard({
        date,
        workspaceId: mockWorkspaceId,
      });

      expect(result.jobs).toEqual(mockJobs);
      expect(result.technicians).toEqual(mockTechs);
      expect(result.date).toEqual(date);

      expect(mockPrisma.job.findMany).toHaveBeenCalledWith({
        where: {
          workspaceId: mockWorkspaceId,
          scheduledDate: '2025-06-15',
        },
        include: {
          customer: true,
          technician: true,
          property: true,
        },
        orderBy: { scheduledStartTime: 'asc' },
      });
    });
  });

  // -----------------------------------------------------------------------
  // reassignJob
  // -----------------------------------------------------------------------
  describe('reassignJob', () => {
    it('reassigns a job to a new technician', async () => {
      mockPrisma.job.update.mockResolvedValue({
        id: mockJobId,
        technicianId: 'tech-2',
      });

      const result = await service.reassignJob({
        jobId: mockJobId,
        newTechnicianId: 'tech-2',
        workspaceId: mockWorkspaceId,
        reason: 'Original technician unavailable',
      });

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId, workspaceId: mockWorkspaceId },
        data: { technicianId: 'tech-2' },
      });
      expect(result.technicianId).toBe('tech-2');
    });
  });

  // -----------------------------------------------------------------------
  // optimizeRoute (stub)
  // -----------------------------------------------------------------------
  describe('optimizeRoute', () => {
    it('returns null (not yet implemented)', async () => {
      const result = await service.optimizeRoute({
        technicianId: mockTechnicianId,
        date: new Date('2025-06-15'),
        workspaceId: mockWorkspaceId,
      });

      expect(result).toBeNull();
    });
  });
});
