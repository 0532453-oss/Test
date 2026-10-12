"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.technicianApi = void 0;
exports.hasNextJob = hasNextJob;
const apiClient_1 = require("../../api/client/apiClient");
function hasNextJob(result) {
    return 'jobId' in result;
}
exports.technicianApi = {
    async getTechnician(technicianId) {
        const response = await apiClient_1.apiClient.get(`/api/technicians/${technicianId}`);
        return response.data;
    },
    async getTechnicians(params) {
        const queryParams = new URLSearchParams();
        if (params?.filter) {
            queryParams.append('filter', JSON.stringify(params.filter));
        }
        if (params?.limit) {
            queryParams.append('limit', params.limit.toString());
        }
        if (params?.offset) {
            queryParams.append('offset', params.offset.toString());
        }
        const response = await apiClient_1.apiClient.get(`/api/technicians?${queryParams.toString()}`);
        return response.data;
    },
    async updateLocation(technicianId, location) {
        const response = await apiClient_1.apiClient.patch(`/api/technicians/${technicianId}/location`, { location });
        return response.data;
    },
    async updateAvailability(technicianId, isAvailable) {
        const response = await apiClient_1.apiClient.patch(`/api/technicians/${technicianId}`, { isAvailable });
        return response.data;
    },
    async getNextJob(technicianId) {
        const response = await apiClient_1.apiClient.get(`/api/technicians/${technicianId}/next-job`);
        return response.data;
    },
};
