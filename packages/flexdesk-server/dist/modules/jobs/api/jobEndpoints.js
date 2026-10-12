"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JOB_ENDPOINTS = void 0;
exports.JOB_ENDPOINTS = {
    LIST: '/api/jobs',
    DETAIL: (id) => `/api/jobs/${id}`,
    CREATE: '/api/jobs',
    UPDATE: (id) => `/api/jobs/${id}`,
    UPDATE_STATUS: (id) => `/api/jobs/${id}/status`,
    DELETE: (id) => `/api/jobs/${id}`,
    SYNC: '/api/jobs/sync',
};
