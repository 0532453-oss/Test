"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceApi = void 0;
const apiClient_1 = require("../../api/client/apiClient");
exports.invoiceApi = {
    async getInvoice(id) {
        const response = await apiClient_1.apiClient.get(`/api/invoices/${id}`);
        return response.data;
    },
    async getInvoices(params) {
        const queryParams = new URLSearchParams();
        if (params?.filter)
            queryParams.append('filter', JSON.stringify(params.filter));
        if (params?.limit)
            queryParams.append('limit', params.limit.toString());
        const response = await apiClient_1.apiClient.get(`/api/invoices?${queryParams}`);
        return response.data;
    },
    async createInvoice(data) {
        const response = await apiClient_1.apiClient.post('/api/invoices', data);
        return response.data;
    },
    async generateFromJob(jobId, options) {
        const response = await apiClient_1.apiClient.post(`/api/invoices/generate-from-job`, {
            jobId,
            ...options,
        });
        return response.data;
    },
    async sendInvoice(id) {
        await apiClient_1.apiClient.post(`/api/invoices/${id}/send`);
    },
};
