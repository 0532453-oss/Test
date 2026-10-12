export declare class UpdateNotificationPreferencesDto {
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    pushEnabled?: boolean;
    jobDispatched?: boolean;
    jobReminder?: boolean;
    jobCompleted?: boolean;
    invoiceSent?: boolean;
    paymentReceived?: boolean;
    estimateSent?: boolean;
    estimateFollowUp?: boolean;
    marketingMessages?: boolean;
    reminderHoursBefore?: number;
    quietHoursStart?: string;
    quietHoursEnd?: string;
}
