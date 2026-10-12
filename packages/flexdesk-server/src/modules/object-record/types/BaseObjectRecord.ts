/**
 * BaseObjectRecord Type
 * 
 * Base type for all records in the system.
 * Extends Prisma-generated types with sync metadata.
 */

export type BaseObjectRecord = {
  id: string;
  workspaceId: string;
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'CONFLICT' | 'FAILED';
  syncVersion: number;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};
