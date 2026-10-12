import { JobCompletionManagerService } from './job-completion-manager.service';

describe('JobCompletionManagerService', () => {
  let service: JobCompletionManagerService;

  const mockWorkspaceId = 'workspace-1';
  const mockJobId = 'job-1';
  const mockUserId = 'user-1';

  const mockPrisma = {
    job: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    jobNote: {
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new JobCompletionManagerService(mockPrisma as any);
  });

  // -----------------------------------------------------------------------
  // startJob — transitions to IN_PROGRESS
  // -----------------------------------------------------------------------
  describe('startJob', () => {
    it('transitions job to IN_PROGRESS', async () => {
      const updatedJob = {
        id: mockJobId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      };
      mockPrisma.job.update.mockResolvedValue(updatedJob);

      const result = await service.startJob({
        jobId: mockJobId,
        workspaceId: mockWorkspaceId,
        userId: mockUserId,
      });

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId, workspaceId: mockWorkspaceId },
        data: {
          status: 'IN_PROGRESS',
          startedAt: expect.any(Date),
        },
      });
      expect(result.status).toBe('IN_PROGRESS');
      expect(result.geofenceWarning).toBeUndefined();
    });

    it('returns geofence warning when technician is outside radius', async () => {
      // Job has location at (0, 0); technician is far away
      mockPrisma.job.findUnique.mockResolvedValue({
        id: mockJobId,
        property: null,
        location: { lat: 0, lng: 0 },
      });
      mockPrisma.job.update.mockResolvedValue({
        id: mockJobId,
        status: 'IN_PROGRESS',
      });

      const result = await service.startJob({
        jobId: mockJobId,
        workspaceId: mockWorkspaceId,
        userId: mockUserId,
        technicianLocation: { lat: 1, lng: 1 }, // ~157km away
      });

      expect(result.geofenceWarning).toBeDefined();
      expect(result.geofenceWarning).toContain('away from the job site');
    });

    it('no geofence warning when technician is within radius', async () => {
      // Job at (40.7128, -74.0060); technician very close
      mockPrisma.job.findUnique.mockResolvedValue({
        id: mockJobId,
        property: { lat: 40.7128, lng: -74.006 },
      });
      mockPrisma.job.update.mockResolvedValue({
        id: mockJobId,
        status: 'IN_PROGRESS',
      });

      const result = await service.startJob({
        jobId: mockJobId,
        workspaceId: mockWorkspaceId,
        userId: mockUserId,
        technicianLocation: { lat: 40.7128, lng: -74.006 }, // same location
      });

      expect(result.geofenceWarning).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // completeJob — transitions to COMPLETED
  // -----------------------------------------------------------------------
  describe('completeJob', () => {
    it('transitions job to COMPLETED', async () => {
      const updatedJob = {
        id: mockJobId,
        status: 'COMPLETED',
        completedAt: new Date(),
        customer: { id: 'c1', name: 'Customer' },
      };
      mockPrisma.job.update.mockResolvedValue(updatedJob);

      const result = await service.completeJob({
        jobId: mockJobId,
        workspaceId: mockWorkspaceId,
        userId: mockUserId,
        completionData: {},
      });

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId, workspaceId: mockWorkspaceId },
        data: {
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        },
        include: { customer: true },
      });
      expect(result.status).toBe('COMPLETED');
    });

    it('creates a job note when completion notes are provided', async () => {
      mockPrisma.job.update.mockResolvedValue({
        id: mockJobId,
        status: 'COMPLETED',
      });

      await service.completeJob({
        jobId: mockJobId,
        workspaceId: mockWorkspaceId,
        userId: mockUserId,
        completionData: { notes: 'Fixed the issue' },
      });

      expect(mockPrisma.jobNote.create).toHaveBeenCalledWith({
        data: {
          jobId: mockJobId,
          userId: mockUserId,
          content: 'Fixed the issue',
          isInternal: false,
        },
      });
    });

    it('does not create a job note when no notes are provided', async () => {
      mockPrisma.job.update.mockResolvedValue({
        id: mockJobId,
        status: 'COMPLETED',
      });

      await service.completeJob({
        jobId: mockJobId,
        workspaceId: mockWorkspaceId,
        userId: mockUserId,
        completionData: {},
      });

      expect(mockPrisma.jobNote.create).not.toHaveBeenCalled();
    });

    it('uses actual userId, not "system"', async () => {
      mockPrisma.job.update.mockResolvedValue({
        id: mockJobId,
        status: 'COMPLETED',
      });

      await service.completeJob({
        jobId: mockJobId,
        workspaceId: mockWorkspaceId,
        userId: 'real-user-id-42',
        completionData: { notes: 'Done' },
      });

      expect(mockPrisma.jobNote.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'real-user-id-42',
          }),
        }),
      );
    });
  });

  // -----------------------------------------------------------------------
  // putJobOnHold — transitions to ON_HOLD
  // -----------------------------------------------------------------------
  describe('putJobOnHold', () => {
    it('transitions job to ON_HOLD and records reason', async () => {
      mockPrisma.job.update.mockResolvedValue({
        id: mockJobId,
        status: 'ON_HOLD',
      });

      await service.putJobOnHold({
        jobId: mockJobId,
        workspaceId: mockWorkspaceId,
        userId: mockUserId,
        reason: 'Waiting for parts',
      });

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId, workspaceId: mockWorkspaceId },
        data: { status: 'ON_HOLD' },
      });

      expect(mockPrisma.jobNote.create).toHaveBeenCalledWith({
        data: {
          jobId: mockJobId,
          userId: mockUserId,
          content: 'Job put on hold: Waiting for parts',
          isInternal: true,
        },
      });
    });
  });

  // -----------------------------------------------------------------------
  // cancelJob — transitions to CANCELLED
  // -----------------------------------------------------------------------
  describe('cancelJob', () => {
    it('transitions job to CANCELLED and records reason', async () => {
      mockPrisma.job.update.mockResolvedValue({
        id: mockJobId,
        status: 'CANCELLED',
      });

      await service.cancelJob({
        jobId: mockJobId,
        workspaceId: mockWorkspaceId,
        reason: 'Customer cancelled',
        cancelledBy: 'admin-user',
      });

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId, workspaceId: mockWorkspaceId },
        data: { status: 'CANCELLED' },
      });

      expect(mockPrisma.jobNote.create).toHaveBeenCalledWith({
        data: {
          jobId: mockJobId,
          userId: 'admin-user',
          content: 'Job cancelled: Customer cancelled',
          isInternal: true,
        },
      });
    });
  });

  // -----------------------------------------------------------------------
  // validateGeofence
  // -----------------------------------------------------------------------
  describe('validateGeofence', () => {
    it('returns isValid=true when no job location exists', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: mockJobId,
        property: null,
        location: null,
      });

      const result = await service.validateGeofence({
        jobId: mockJobId,
        technicianLocation: { lat: 40, lng: -74 },
        workspaceId: mockWorkspaceId,
      });

      expect(result.isValid).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it('returns isValid=true when technician is within 200m', async () => {
      // NYC coordinates
      mockPrisma.job.findUnique.mockResolvedValue({
        id: mockJobId,
        property: { lat: 40.7128, lng: -74.006 },
      });

      const result = await service.validateGeofence({
        jobId: mockJobId,
        technicianLocation: { lat: 40.7128, lng: -74.006 },
        workspaceId: mockWorkspaceId,
      });

      expect(result.isValid).toBe(true);
      expect(result.distance).toBe(0);
    });

    it('returns isValid=false when technician is far away', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: mockJobId,
        property: null,
        location: { lat: 40.7128, lng: -74.006 },
      });

      const result = await service.validateGeofence({
        jobId: mockJobId,
        technicianLocation: { lat: 40.72, lng: -73.99 }, // ~1.5km away
        workspaceId: mockWorkspaceId,
      });

      expect(result.isValid).toBe(false);
      expect(result.distance).toBeGreaterThan(200);
      expect(result.warning).toContain('away from the job site');
    });

    it('uses custom radius when provided', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: mockJobId,
        property: { lat: 40.7128, lng: -74.006 },
      });

      // About 500m away
      const result = await service.validateGeofence({
        jobId: mockJobId,
        technicianLocation: { lat: 40.7168, lng: -74.006 },
        workspaceId: mockWorkspaceId,
        radiusMeters: 1000, // generous radius
      });

      expect(result.isValid).toBe(true);
    });

    it('prefers property location over job.location JSON', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: mockJobId,
        property: { lat: 40.7128, lng: -74.006 },
        location: { lat: 0, lng: 0 }, // far away location in JSON
      });

      const result = await service.validateGeofence({
        jobId: mockJobId,
        technicianLocation: { lat: 40.7128, lng: -74.006 },
        workspaceId: mockWorkspaceId,
      });

      // Should use property location, so technician is at same spot
      expect(result.isValid).toBe(true);
      expect(result.distance).toBe(0);
    });
  });
});
