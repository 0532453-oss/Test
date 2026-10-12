"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_CONFIG = void 0;
exports.API_CONFIG = {
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
};
