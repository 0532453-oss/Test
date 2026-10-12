import crypto from 'crypto';

export interface JobTokenPayload {
  jobId: string;
  workspaceId: string;
  exp: number;
}

export interface CustomerPortalTokenPayload {
  customerId: string;
  workspaceId: string;
  exp: number;
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

let _jobTokenSecret: string | undefined;
let _customerPortalSecret: string | undefined;

function getJobTokenSecret(): string {
  if (!_jobTokenSecret) {
    _jobTokenSecret = getRequiredEnv('JOB_TOKEN_SECRET');
  }
  return _jobTokenSecret;
}

function getCustomerPortalSecret(): string {
  if (!_customerPortalSecret) {
    _customerPortalSecret = getRequiredEnv('CUSTOMER_PORTAL_SECRET');
  }
  return _customerPortalSecret;
}

function base64UrlEncode(input: Buffer | string): string {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = 4 - (normalized.length % 4 || 4);
  const padded = normalized.padEnd(normalized.length + padLength, '=');
  return Buffer.from(padded, 'base64');
}

export function signJobToken(payload: JobTokenPayload): string {
  const json = JSON.stringify(payload);
  const payloadSegment = base64UrlEncode(json);

  const hmac = crypto.createHmac('sha256', getJobTokenSecret());
  hmac.update(payloadSegment);
  const signature = hmac.digest();

  const signatureSegment = base64UrlEncode(signature);

  return `${payloadSegment}.${signatureSegment}`;
}

export function verifyJobToken(token: string): JobTokenPayload | null {
  if (!token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payloadSegment, signatureSegment] = parts;

  const hmac = crypto.createHmac('sha256', getJobTokenSecret());
  hmac.update(payloadSegment);
  const expectedSignature = hmac.digest();

  let providedSignature: Buffer;
  try {
    providedSignature = base64UrlDecode(signatureSegment);
  } catch {
    return null;
  }

  if (
    providedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(providedSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const payloadJson = base64UrlDecode(payloadSegment).toString('utf8');
    const payload = JSON.parse(payloadJson) as JobTokenPayload;

    if (
      !payload ||
      typeof payload.jobId !== 'string' ||
      typeof payload.workspaceId !== 'string' ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function signCustomerPortalToken(
  payload: CustomerPortalTokenPayload,
): string {
  const json = JSON.stringify(payload);
  const payloadSegment = base64UrlEncode(json);

  const hmac = crypto.createHmac('sha256', getCustomerPortalSecret());
  hmac.update(payloadSegment);
  const signature = hmac.digest();

  const signatureSegment = base64UrlEncode(signature);

  return `${payloadSegment}.${signatureSegment}`;
}

export function verifyCustomerPortalToken(
  token: string,
): CustomerPortalTokenPayload | null {
  if (!token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payloadSegment, signatureSegment] = parts;

  const hmac = crypto.createHmac('sha256', getCustomerPortalSecret());
  hmac.update(payloadSegment);
  const expectedSignature = hmac.digest();

  let providedSignature: Buffer;
  try {
    providedSignature = base64UrlDecode(signatureSegment);
  } catch {
    return null;
  }

  if (
    providedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(providedSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const payloadJson = base64UrlDecode(payloadSegment).toString('utf8');
    const payload = JSON.parse(payloadJson) as CustomerPortalTokenPayload;

    if (
      !payload ||
      typeof payload.customerId !== 'string' ||
      typeof payload.workspaceId !== 'string' ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

