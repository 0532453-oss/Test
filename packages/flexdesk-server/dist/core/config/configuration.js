"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => {
    let databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/flexdesk';
    if (process.env.NODE_ENV === 'production' && !databaseUrl.includes('sslmode=')) {
        const separator = databaseUrl.includes('?') ? '&' : '?';
        databaseUrl += `${separator}sslmode=require`;
    }
    return {
        database: {
            url: databaseUrl,
        },
        jwt: {
            secret: process.env.JWT_SECRET || '',
            expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        },
        app: {
            port: parseInt(process.env.PORT || '3001', 10),
            nodeEnv: process.env.NODE_ENV || 'development',
            corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
            publicAppUrl: process.env.PUBLIC_APP_URL || 'http://localhost:3000',
        },
        billing: {
            defaultHourlyRate: parseFloat(process.env.DEFAULT_JOB_HOURLY_RATE || '100'),
            defaultTaxRate: parseFloat(process.env.DEFAULT_TAX_RATE || '0.1'),
            defaultDueDateDays: parseInt(process.env.DEFAULT_INVOICE_DUE_DATE_DAYS || '30', 10),
        },
        stripe: {
            secretKey: process.env.STRIPE_SECRET_KEY || '',
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
            platformFeePercent: parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT || '15'),
        },
        sendgrid: {
            apiKey: process.env.SENDGRID_API_KEY || '',
            fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@flexdesk.io',
            fromName: process.env.SENDGRID_FROM_NAME || 'FlexDesk',
        },
        twilio: {
            accountSid: process.env.TWILIO_ACCOUNT_SID || '',
            authToken: process.env.TWILIO_AUTH_TOKEN || '',
            fromNumber: process.env.TWILIO_FROM_NUMBER || '',
        },
        googleMaps: {
            apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        },
    };
};
