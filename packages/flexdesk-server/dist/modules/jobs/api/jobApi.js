"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobApi = void 0;
const apiClient_1 = require("../../api/client/apiClient");
exports.jobApi = {
    async getJob(jobId) {
        const response = await apiClient_1.apiClient.get(`/api/jobs/${jobId}`);
        return response.data;
    },
    async getJobs(params) {
        const queryParams = new URLSearchParams();
        if (params?.filter) {
            queryParams.append('filter', JSON.stringify(params.filter));
        }
        if (params?.orderBy) {
            queryParams.append('orderBy', JSON.stringify(params.orderBy));
        }
        if (params?.limit) {
            queryParams.append('limit', params.limit.toString());
        }
        if (params?.offset) {
            queryParams.append('offset', params.offset.toString());
        }
        const response = await apiClient_1.apiClient.get(`/api/jobs?${queryParams.toString()}`);
        return response.data;
    },
    async createJob(data) {
        const response = await apiClient_1.apiClient.post('/api/jobs', data);
        return response.data;
    },
    async updateJob(jobId, data) {
        const response = await apiClient_1.apiClient.patch(`/api/jobs/${jobId}`, data);
        return response.data;
    },
    async updateJobStatus(jobId, status) {
        const response = await apiClient_1.apiClient.patch(`/api/jobs/${jobId}/status`, { status });
        return response.data;
    },
    async deleteJob(jobId) {
        await apiClient_1.apiClient.delete(`/api/jobs/${jobId}`);
    },
    async syncJobs(date, technicianId) {
        const queryParams = new URLSearchParams();
        queryParams.append('date', date);
        if (technicianId) {
            queryParams.append('technicianId', technicianId);
        }
        const response = await apiClient_1.apiClient.get(`/api/jobs/sync?${queryParams.toString()}`);
        return Array.isArray(response.data) ? response.data : [response.data];
    },
};
