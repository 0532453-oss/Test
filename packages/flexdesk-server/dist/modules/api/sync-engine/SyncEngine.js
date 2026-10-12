"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncEngine = exports.SyncEngine = exports.SyncStrategy = void 0;
const apiClient_1 = require("../client/apiClient");
const IndexedDBClient_1 = require("../storage/IndexedDBClient");
function format(date, formatStr) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    if (formatStr === 'yyyy-MM-dd')
        return `${year}-${month}-${day}`;
    return `${year}-${month}-${day}`;
}
function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}
function endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}
var SyncStrategy;
(function (SyncStrategy) {
    SyncStrategy["INCREMENTAL"] = "INCREMENTAL";
    SyncStrategy["FULL"] = "FULL";
    SyncStrategy["DATE_RANGE"] = "DATE_RANGE";
})(SyncStrategy || (exports.SyncStrategy = SyncStrategy = {}));
class SyncEngine {
    async syncTechnicianSchedule(date = new Date()) {
        const today = format(date, 'yyyy-MM-dd');
        try {
            const response = await apiClient_1.apiClient.get(`/jobs/sync?date=${today}`, { skipCache: true });
            const rawJobs = Array.isArray(response.data)
                ? response.data
                : [response.data];
            const nowIso = new Date().toISOString();
            const remoteJobs = rawJobs.map((job) => ({
                ...job,
                syncStatus: 'SYNCED',
                lastSyncedAt: nowIso,
            }));
            await IndexedDBClient_1.indexedDBClient.init();
            if (remoteJobs.length > 0) {
                const technicianId = remoteJobs[0].technicianId;
                if (technicianId) {
                    const existingJobs = await this.getCachedSchedule(technicianId, date);
                    const remoteJobIds = new Set(remoteJobs.map((job) => job.id));
                    const existingJobIds = new Set(existingJobs.map((job) => job.id));
                    await IndexedDBClient_1.indexedDBClient.putAll('jobs', remoteJobs);
                    const jobsToDelete = existingJobs.filter((job) => !remoteJobIds.has(job.id));
                    for (const job of jobsToDelete) {
                        if (job.scheduledAt) {
                            const scheduledDate = new Date(job.scheduledAt);
                            const start = startOfDay(date);
                            const end = endOfDay(date);
                            if (scheduledDate >= start && scheduledDate <= end) {
                                await IndexedDBClient_1.indexedDBClient.delete('jobs', job.id);
                            }
                        }
                    }
                }
                else {
                    await IndexedDBClient_1.indexedDBClient.putAll('jobs', remoteJobs);
                }
                await this.updateSyncMetadata({
                    key: `technician_schedule_lastSync_${today}`,
                    value: {
                        date: today,
                        jobCount: remoteJobs.length,
                    },
                    updatedAt: Date.now(),
                });
            }
            else {
                await this.updateSyncMetadata({
                    key: `technician_schedule_lastSync_${today}`,
                    value: {
                        date: today,
                        jobCount: 0,
                    },
                    updatedAt: Date.now(),
                });
            }
        }
        catch (error) {
            console.error('Failed to sync technician schedule:', error);
            throw error;
        }
    }
    async getCachedSchedule(technicianId, date = new Date()) {
        await IndexedDBClient_1.indexedDBClient.init();
        const allJobs = await IndexedDBClient_1.indexedDBClient.query('jobs', 'technicianId', IDBKeyRange.only(technicianId));
        const start = startOfDay(date);
        const end = endOfDay(date);
        return allJobs.filter((job) => {
            if (!job.scheduledAt)
                return false;
            const scheduledDate = new Date(job.scheduledAt);
            return scheduledDate >= start && scheduledDate <= end;
        });
    }
    async syncByDateRange(entityType, startDate, endDate, filters) {
        const start = format(startDate, 'yyyy-MM-dd');
        const end = format(endDate, 'yyyy-MM-dd');
        try {
            const endpoint = `/${entityType.toLowerCase()}s/sync?startDate=${start}&endDate=${end}`;
            const response = await apiClient_1.apiClient.get(endpoint, { skipCache: true });
            const entities = Array.isArray(response.data) ? response.data : [response.data];
            const storeName = entityType.toLowerCase() + 's';
            if (entities.length > 0) {
                await IndexedDBClient_1.indexedDBClient.init();
                await IndexedDBClient_1.indexedDBClient.putAll(storeName, entities);
                await this.updateSyncMetadata({
                    key: `${entityType.toLowerCase()}_sync_${start}_${end}`,
                    value: {
                        entityType,
                        startDate: start,
                        endDate: end,
                        count: entities.length,
                    },
                    updatedAt: Date.now(),
                });
            }
        }
        catch (error) {
            console.error(`Failed to sync ${entityType} by date range:`, error);
            throw error;
        }
    }
    async incrementalSync(entityType, lastSyncTimestamp) {
        const timestamp = lastSyncTimestamp || (await this.getLastSyncTimestamp(entityType));
        try {
            const endpoint = `/${entityType.toLowerCase()}s/sync?since=${timestamp}`;
            const response = await apiClient_1.apiClient.get(endpoint, { skipCache: true });
            const entities = Array.isArray(response.data) ? response.data : [response.data];
            const storeName = entityType.toLowerCase() + 's';
            if (entities.length > 0) {
                await IndexedDBClient_1.indexedDBClient.init();
                for (const entity of entities) {
                    await IndexedDBClient_1.indexedDBClient.put(storeName, entity);
                }
                await this.updateSyncMetadata({
                    key: `${entityType.toLowerCase()}_lastSync`,
                    value: {
                        entityType,
                        timestamp: Date.now(),
                        count: entities.length,
                    },
                    updatedAt: Date.now(),
                });
            }
        }
        catch (error) {
            console.error(`Failed to incremental sync ${entityType}:`, error);
            throw error;
        }
    }
    async getLastSyncTimestamp(entityType) {
        await IndexedDBClient_1.indexedDBClient.init();
        const metadata = await IndexedDBClient_1.indexedDBClient.get('syncMetadata', `${entityType.toLowerCase()}_lastSync`);
        return metadata?.value?.timestamp || 0;
    }
    async updateSyncMetadata(metadata) {
        await IndexedDBClient_1.indexedDBClient.init();
        await IndexedDBClient_1.indexedDBClient.put('syncMetadata', metadata);
    }
    async clearCache(entityType, startDate, endDate) {
        await IndexedDBClient_1.indexedDBClient.init();
        const storeName = entityType.toLowerCase() + 's';
        if (!startDate || !endDate) {
            const allEntities = await IndexedDBClient_1.indexedDBClient.getAll(storeName);
            for (const entity of allEntities) {
                await IndexedDBClient_1.indexedDBClient.delete(storeName, entity.id);
            }
        }
        else {
            const allEntities = await IndexedDBClient_1.indexedDBClient.getAll(storeName);
            const start = startOfDay(startDate);
            const end = endOfDay(endDate);
            for (const entity of allEntities) {
                const entityDate = entity.scheduledAt || entity.createdAt;
                if (entityDate) {
                    const date = new Date(entityDate);
                    if (date >= start && date <= end) {
                        await IndexedDBClient_1.indexedDBClient.delete(storeName, entity.id);
                    }
                }
            }
        }
    }
    async getSyncStatus(entityType) {
        await IndexedDBClient_1.indexedDBClient.init();
        const metadata = await IndexedDBClient_1.indexedDBClient.get('syncMetadata', `${entityType.toLowerCase()}_lastSync`);
        const storeName = entityType.toLowerCase() + 's';
        const cachedEntities = await IndexedDBClient_1.indexedDBClient.getAll(storeName);
        const lastSyncedAt = metadata?.updatedAt || null;
        const isStale = lastSyncedAt
            ? Date.now() - lastSyncedAt > 24 * 60 * 60 * 1000
            : true;
        return {
            lastSyncedAt,
            cachedCount: cachedEntities.length,
            isStale,
        };
    }
}
exports.SyncEngine = SyncEngine;
exports.syncEngine = new SyncEngine();
