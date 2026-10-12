export interface DatabaseConfig {
    url: string;
}
export interface JwtConfig {
    secret: string;
    expiresIn: string;
}
export interface AppConfig {
    port: number;
    nodeEnv: string;
    corsOrigin: string[];
    publicAppUrl: string;
}
export interface BillingConfig {
    defaultHourlyRate: number;
    defaultTaxRate: number;
    defaultDueDateDays: number;
}
export interface StripeConfig {
    secretKey: string;
    webhookSecret: string;
    platformFeePercent: number;
}
export interface SendGridConfig {
    apiKey: string;
    fromEmail: string;
    fromName: string;
}
export interface TwilioConfig {
    accountSid: string;
    authToken: string;
    fromNumber: string;
}
export interface GoogleMapsConfig {
    apiKey: string;
}
export interface Configuration {
    database: DatabaseConfig;
    jwt: JwtConfig;
    app: AppConfig;
    billing: BillingConfig;
    stripe: StripeConfig;
    sendgrid: SendGridConfig;
    twilio: TwilioConfig;
    googleMaps: GoogleMapsConfig;
}
declare const _default: () => Configuration;
export default _default;
