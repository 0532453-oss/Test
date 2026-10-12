declare enum Environment {
    Development = "development",
    Production = "production",
    Test = "test"
}
export declare class EnvironmentVariables {
    NODE_ENV?: Environment;
    PORT?: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_EXPIRES_IN?: string;
    CORS_ORIGIN?: string;
    PUBLIC_APP_URL?: string;
    DEFAULT_JOB_HOURLY_RATE?: number;
    DEFAULT_TAX_RATE?: number;
    DEFAULT_INVOICE_DUE_DATE_DAYS?: number;
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    SENDGRID_API_KEY?: string;
    SENDGRID_FROM_EMAIL?: string;
    SENDGRID_FROM_NAME?: string;
    CUSTOMER_PORTAL_SECRET: string;
    JOB_TOKEN_SECRET: string;
    TWILIO_ACCOUNT_SID?: string;
    TWILIO_AUTH_TOKEN?: string;
    TWILIO_FROM_NUMBER?: string;
    GOOGLE_MAPS_API_KEY?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    FRONTEND_URL?: string;
}
export declare function validate(config: Record<string, unknown>): EnvironmentVariables;
export {};
