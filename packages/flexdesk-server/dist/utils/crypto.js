"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signJobToken = signJobToken;
exports.verifyJobToken = verifyJobToken;
exports.signCustomerPortalToken = signCustomerPortalToken;
exports.verifyCustomerPortalToken = verifyCustomerPortalToken;
const crypto_1 = require("crypto");
function getRequiredEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}
let _jobTokenSecret;
let _customerPortalSecret;
function getJobTokenSecret() {
    if (!_jobTokenSecret) {
        _jobTokenSecret = getRequiredEnv('JOB_TOKEN_SECRET');
    }
    return _jobTokenSecret;
}
function getCustomerPortalSecret() {
    if (!_customerPortalSecret) {
        _customerPortalSecret = getRequiredEnv('CUSTOMER_PORTAL_SECRET');
    }
    return _customerPortalSecret;
}
function base64UrlEncode(input) {
    const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
    return buffer
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}
function base64UrlDecode(input) {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = 4 - (normalized.length % 4 || 4);
    const padded = normalized.padEnd(normalized.length + padLength, '=');
    return Buffer.from(padded, 'base64');
}
function signJobToken(payload) {
    const json = JSON.stringify(payload);
    const payloadSegment = base64UrlEncode(json);
    const hmac = crypto_1.default.createHmac('sha256', getJobTokenSecret());
    hmac.update(payloadSegment);
    const signature = hmac.digest();
    const signatureSegment = base64UrlEncode(signature);
    return `${payloadSegment}.${signatureSegment}`;
}
function verifyJobToken(token) {
    if (!token) {
        return null;
    }
    const parts = token.split('.');
    if (parts.length !== 2) {
        return null;
    }
    const [payloadSegment, signatureSegment] = parts;
    const hmac = crypto_1.default.createHmac('sha256', getJobTokenSecret());
    hmac.update(payloadSegment);
    const expectedSignature = hmac.digest();
    let providedSignature;
    try {
        providedSignature = base64UrlDecode(signatureSegment);
    }
    catch {
        return null;
    }
    if (providedSignature.length !== expectedSignature.length ||
        !crypto_1.default.timingSafeEqual(providedSignature, expectedSignature)) {
        return null;
    }
    try {
        const payloadJson = base64UrlDecode(payloadSegment).toString('utf8');
        const payload = JSON.parse(payloadJson);
        if (!payload ||
            typeof payload.jobId !== 'string' ||
            typeof payload.workspaceId !== 'string' ||
            typeof payload.exp !== 'number') {
            return null;
        }
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            return null;
        }
        return payload;
    }
    catch {
        return null;
    }
}
function signCustomerPortalToken(payload) {
    const json = JSON.stringify(payload);
    const payloadSegment = base64UrlEncode(json);
    const hmac = crypto_1.default.createHmac('sha256', getCustomerPortalSecret());
    hmac.update(payloadSegment);
    const signature = hmac.digest();
    const signatureSegment = base64UrlEncode(signature);
    return `${payloadSegment}.${signatureSegment}`;
}
function verifyCustomerPortalToken(token) {
    if (!token) {
        return null;
    }
    const parts = token.split('.');
    if (parts.length !== 2) {
        return null;
    }
    const [payloadSegment, signatureSegment] = parts;
    const hmac = crypto_1.default.createHmac('sha256', getCustomerPortalSecret());
    hmac.update(payloadSegment);
    const expectedSignature = hmac.digest();
    let providedSignature;
    try {
        providedSignature = base64UrlDecode(signatureSegment);
    }
    catch {
        return null;
    }
    if (providedSignature.length !== expectedSignature.length ||
        !crypto_1.default.timingSafeEqual(providedSignature, expectedSignature)) {
        return null;
    }
    try {
        const payloadJson = base64UrlDecode(payloadSegment).toString('utf8');
        const payload = JSON.parse(payloadJson);
        if (!payload ||
            typeof payload.customerId !== 'string' ||
            typeof payload.workspaceId !== 'string' ||
            typeof payload.exp !== 'number') {
            return null;
        }
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            return null;
        }
        return payload;
    }
    catch {
        return null;
    }
}
