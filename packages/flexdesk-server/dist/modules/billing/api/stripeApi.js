"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeApi = void 0;
const apiClient_1 = require("../../api/client/apiClient");
exports.stripeApi = {
    async createPaymentIntent(invoiceId) {
        const response = await apiClient_1.apiClient.post(`/api/invoices/${invoiceId}/pay`, {});
        return response.data;
    },
    async confirmPayment(paymentIntentId) {
        const response = await apiClient_1.apiClient.post(`/api/stripe/confirm-payment`, { paymentIntentId });
        return response.data;
    },
    async getPaymentStatus(paymentIntentId) {
        const response = await apiClient_1.apiClient.get(`/api/stripe/payment-status/${paymentIntentId}`);
        return response.data;
    },
};
