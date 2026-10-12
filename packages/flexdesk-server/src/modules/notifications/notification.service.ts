import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Estimate, type Invoice, type Job, type JobStatus, type Customer, type NotificationPreference } from '@prisma/client';
import * as sgMail from '@sendgrid/mail';
import { Twilio } from 'twilio';

import { PrismaService } from '@/core/database/prisma.service';
import { signJobToken } from '@/utils/crypto';

export interface JobStatusChangeEvent {
  jobId: string;
  workspaceId: string;
  previousStatus: JobStatus;
  nextStatus: JobStatus;
  trackingLink?: string;
  invoiceLink?: string;
  timestamp: Date;
}

export interface EmailPayload {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}

export interface SmsPayload {
  to: string;
  message: string;
}

export interface NotificationResult {
  success: boolean;
  channel: 'email' | 'sms' | 'push';
  messageId?: string;
  error?: string;
}

export type NotificationType =
  | 'jobDispatched'
  | 'jobReminder'
  | 'jobCompleted'
  | 'invoiceSent'
  | 'paymentReceived'
  | 'estimateSent'
  | 'estimateFollowUp'
  | 'marketingMessages';

export interface CustomerWithPreference extends Customer {
  notificationPreference?: NotificationPreference | null;
}

// Default notification preferences when none exist
const DEFAULT_PREFERENCES: Omit<NotificationPreference, 'id' | 'customerId' | 'createdAt' | 'updatedAt'> = {
  emailEnabled: true,
  smsEnabled: true,
  pushEnabled: false,
  jobDispatched: true,
  jobReminder: true,
  jobCompleted: true,
  invoiceSent: true,
  paymentReceived: true,
  estimateSent: true,
  estimateFollowUp: false,
  marketingMessages: false,
  reminderHoursBefore: 24,
  quietHoursStart: '21:00',
  quietHoursEnd: '08:00',
};

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private readonly publicBaseUrl: string;
  private readonly sendGridApiKey: string | undefined;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private isEmailConfigured = false;

  // Twilio
  private twilioClient: Twilio | null = null;
  private readonly twilioAccountSid: string | undefined;
  private readonly twilioAuthToken: string | undefined;
  private readonly twilioFromNumber: string | undefined;
  private isSmsConfigured = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.publicBaseUrl = this.configService.get<string>('PUBLIC_APP_URL', '');
    this.sendGridApiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL', 'noreply@flexdesk.io');
    this.fromName = this.configService.get<string>('SENDGRID_FROM_NAME', 'FlexDesk');

    // Twilio config
    this.twilioAccountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    this.twilioAuthToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioFromNumber = this.configService.get<string>('TWILIO_FROM_NUMBER');
  }

  onModuleInit() {
    // Initialize SendGrid
    if (this.sendGridApiKey && this.sendGridApiKey !== 'your-sendgrid-api-key') {
      sgMail.setApiKey(this.sendGridApiKey);
      this.isEmailConfigured = true;
      this.logger.log('SendGrid email client configured successfully');
    } else {
      this.logger.warn('SendGrid API key not configured - emails will be logged only');
    }

    // Initialize Twilio
    if (
      this.twilioAccountSid &&
      this.twilioAuthToken &&
      this.twilioFromNumber &&
      this.twilioAccountSid !== '' &&
      this.twilioAuthToken !== ''
    ) {
      this.twilioClient = new Twilio(this.twilioAccountSid, this.twilioAuthToken);
      this.isSmsConfigured = true;
      this.logger.log('Twilio SMS client configured successfully');
    } else {
      this.logger.warn('Twilio not configured - SMS will be logged only');
    }
  }

  /**
   * Get notification preferences for a customer.
   * Returns default preferences if none exist.
   */
  async getCustomerPreferences(customerId: string): Promise<NotificationPreference | typeof DEFAULT_PREFERENCES> {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: { customerId },
    });

    return preference || DEFAULT_PREFERENCES;
  }

  /**
   * Create or update notification preferences for a customer.
   */
  async upsertCustomerPreferences(
    customerId: string,
    preferences: Partial<Omit<NotificationPreference, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<NotificationPreference> {
    return this.prisma.notificationPreference.upsert({
      where: { customerId },
      update: preferences,
      create: {
        customerId,
        ...DEFAULT_PREFERENCES,
        ...preferences,
      },
    });
  }

  /**
   * Check if a specific notification type is enabled for a customer.
   */
  async isNotificationEnabled(
    customerId: string,
    notificationType: NotificationType,
    channel: 'email' | 'sms' | 'push',
  ): Promise<boolean> {
    const prefs = await this.getCustomerPreferences(customerId);

    // Check channel enabled
    const channelEnabled =
      (channel === 'email' && prefs.emailEnabled) ||
      (channel === 'sms' && prefs.smsEnabled) ||
      (channel === 'push' && prefs.pushEnabled);

    if (!channelEnabled) {
      return false;
    }

    // Check notification type enabled
    return prefs[notificationType] ?? true;
  }

  /**
   * Check if current time is within quiet hours.
   */
  isWithinQuietHours(prefs: NotificationPreference | typeof DEFAULT_PREFERENCES): boolean {
    if (!prefs.quietHoursStart || !prefs.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = prefs.quietHoursStart.split(':').map(Number);
    const [endHour, endMinute] = prefs.quietHoursEnd.split(':').map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    // Handle overnight quiet hours (e.g., 21:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }

    return currentTime >= startTime && currentTime < endTime;
  }

  async sendEmail(payload: EmailPayload): Promise<NotificationResult> {
    this.logger.log(`[Email] Sending to ${payload.to}: ${payload.subject}`);

    // If SendGrid is not configured, fall back to logging only
    if (!this.isEmailConfigured) {
      this.logger.debug('[Email] Payload (SendGrid not configured):', JSON.stringify(payload, null, 2));
      return {
        success: true,
        channel: 'email',
        messageId: `email-mock-${Date.now()}`,
      };
    }

    try {
      const htmlContent = this.renderEmailTemplate(payload.template, payload.context);

      const msg = {
        to: payload.to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: payload.subject,
        html: htmlContent,
      };

      const [response] = await sgMail.send(msg);

      this.logger.log(`[Email] Sent successfully to ${payload.to}, messageId: ${response.headers['x-message-id']}`);

      return {
        success: true,
        channel: 'email',
        messageId: response.headers['x-message-id'] as string,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[Email] Failed to send to ${payload.to}: ${errorMessage}`, error);

      return {
        success: false,
        channel: 'email',
        error: errorMessage,
      };
    }
  }

  /**
   * Renders an email template with the provided context.
   * Uses simple HTML templates that can be enhanced with dynamic templates in SendGrid.
   */
  private renderEmailTemplate(template: string, context: Record<string, unknown>): string {
    const templates: Record<string, (ctx: Record<string, unknown>) => string> = {
      'job-dispatched': (ctx) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Service Appointment is On the Way!</h2>
          <p>Hello ${ctx.customerName},</p>
          <p>Great news! A technician has been dispatched for your service appointment: <strong>${ctx.jobTitle}</strong></p>
          <p>Scheduled for: ${ctx.scheduledAt ? new Date(ctx.scheduledAt as string).toLocaleString() : 'TBD'}</p>
          <p><a href="${ctx.trackingLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Track Your Technician</a></p>
          <p>Thank you for choosing FlexDesk!</p>
        </div>
      `,
      'job-completed': (ctx) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Service Completed</h2>
          <p>Hello ${ctx.customerName},</p>
          <p>Your service appointment <strong>${ctx.jobTitle}</strong> has been completed.</p>
          <p>Invoice Number: ${ctx.invoiceNumber}</p>
          <p>Total: $${ctx.total}</p>
          <p><a href="${ctx.invoiceLink}" style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px;">View Invoice</a></p>
          <p>Thank you for your business!</p>
        </div>
      `,
      'invoice-sent': (ctx) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Invoice ${ctx.invoiceNumber}</h2>
          <p>Hello ${ctx.customerName},</p>
          <p>Please find your invoice below:</p>
          <p>Amount Due: $${ctx.amount}</p>
          <p>Due Date: ${ctx.dueDate ? new Date(ctx.dueDate as string).toLocaleDateString() : 'Upon Receipt'}</p>
          <p><a href="${ctx.invoiceLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">View & Pay Invoice</a></p>
          <p>Thank you for your business!</p>
        </div>
      `,
      'payment-received': (ctx) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Payment Confirmed</h2>
          <p>Hello ${ctx.customerName},</p>
          <p>We have received your payment for Invoice ${ctx.invoiceNumber}.</p>
          <p>Amount Paid: $${ctx.amount}</p>
          <p>Payment Date: ${ctx.paidAt ? new Date(ctx.paidAt as string).toLocaleString() : new Date().toLocaleString()}</p>
          <p>Thank you for your payment!</p>
        </div>
      `,
      'job-reminder': (ctx) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Service Reminder</h2>
          <p>Hello ${ctx.customerName},</p>
          <p>This is a friendly reminder about your upcoming service appointment:</p>
          <p><strong>${ctx.jobTitle}</strong></p>
          <p>Scheduled for: ${ctx.scheduledAt ? new Date(ctx.scheduledAt as string).toLocaleString() : 'TBD'}</p>
          <p>Your appointment is in approximately ${ctx.hoursUntil} hours.</p>
          <p>Thank you for choosing FlexDesk!</p>
        </div>
      `,
      'estimate-sent': (ctx) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Estimate ${ctx.estimateNumber}</h2>
          <p>Hello ${ctx.customerName},</p>
          <p>We've prepared an estimate for you: <strong>${ctx.title}</strong></p>
          <p>Estimated Total: $${ctx.total}</p>
          <p>Valid Until: ${ctx.validUntil ? new Date(ctx.validUntil as string).toLocaleDateString() : 'N/A'}</p>
          <p><a href="${ctx.estimateLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">View Estimate</a></p>
          <p>Thank you for considering FlexDesk!</p>
        </div>
      `,
    };

    const templateFn = templates[template];
    if (templateFn) {
      return templateFn(context);
    }

    // Default template for unknown types
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>FlexDesk Notification</h2>
        <pre>${JSON.stringify(context, null, 2)}</pre>
      </div>
    `;
  }

  async sendSms(payload: SmsPayload): Promise<NotificationResult> {
    this.logger.log(`[SMS] Sending to ${payload.to}`);

    // If Twilio is not configured, fall back to logging only
    if (!this.isSmsConfigured || !this.twilioClient) {
      this.logger.debug('[SMS] Payload (Twilio not configured):', JSON.stringify(payload, null, 2));
      return {
        success: true,
        channel: 'sms',
        messageId: `sms-mock-${Date.now()}`,
      };
    }

    try {
      const message = await this.twilioClient.messages.create({
        body: payload.message,
        to: payload.to,
        from: this.twilioFromNumber,
      });

      this.logger.log(`[SMS] Sent successfully to ${payload.to}, sid: ${message.sid}`);

      return {
        success: true,
        channel: 'sms',
        messageId: message.sid,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[SMS] Failed to send to ${payload.to}: ${errorMessage}`, error);

      return {
        success: false,
        channel: 'sms',
        error: errorMessage,
      };
    }
  }

  /**
   * Send notification respecting customer preferences.
   * Returns results for each channel attempted.
   */
  async sendNotificationWithPreferences(
    customer: CustomerWithPreference,
    notificationType: NotificationType,
    emailPayload: Omit<EmailPayload, 'to'> | null,
    smsPayload: Omit<SmsPayload, 'to'> | null,
  ): Promise<{ email?: NotificationResult; sms?: NotificationResult }> {
    const results: { email?: NotificationResult; sms?: NotificationResult } = {};
    const prefs = customer.notificationPreference || DEFAULT_PREFERENCES;

    // Check quiet hours
    if (this.isWithinQuietHours(prefs)) {
      this.logger.debug(`[Notification] Skipping - within quiet hours for customer ${customer.id}`);
      return results;
    }

    // Check notification type enabled
    if (!prefs[notificationType]) {
      this.logger.debug(`[Notification] Skipping - ${notificationType} disabled for customer ${customer.id}`);
      return results;
    }

    // Send email if enabled and customer has email
    if (emailPayload && prefs.emailEnabled && customer.email) {
      results.email = await this.sendEmail({
        ...emailPayload,
        to: customer.email,
      });
    }

    // Send SMS if enabled and customer has phone
    if (smsPayload && prefs.smsEnabled && customer.phone) {
      results.sms = await this.sendSms({
        ...smsPayload,
        to: customer.phone,
      });
    }

    return results;
  }

  async notifyJobDispatched(
    job: Job,
    customer: CustomerWithPreference,
    context: { previousStatus: JobStatus },
  ): Promise<JobStatusChangeEvent> {
    const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

    const token = signJobToken({
      jobId: job.id,
      workspaceId: job.workspaceId,
      exp,
    });

    const trackingLink = `${this.publicBaseUrl}/public/track/${token}`;

    const event: JobStatusChangeEvent = {
      jobId: job.id,
      workspaceId: job.workspaceId,
      previousStatus: context.previousStatus,
      nextStatus: job.status,
      trackingLink,
      timestamp: new Date(),
    };

    this.logger.log('[Notification] Job dispatched', event);

    // Send notifications respecting preferences
    await this.sendNotificationWithPreferences(
      customer,
      'jobDispatched',
      {
        subject: `Your service appointment is on the way - ${job.title}`,
        template: 'job-dispatched',
        context: {
          customerName: customer.name,
          jobTitle: job.title,
          scheduledAt: job.scheduledAt,
          trackingLink,
        },
      },
      {
        message: `Your technician is on the way! Track their arrival: ${trackingLink}`,
      },
    );

    return event;
  }

  async notifyJobCompleted(
    job: Job,
    customer: CustomerWithPreference,
    context: { previousStatus: JobStatus; invoice: Invoice },
  ): Promise<JobStatusChangeEvent> {
    const invoiceLink = `${this.publicBaseUrl}/invoices/${context.invoice.id}`;

    const event: JobStatusChangeEvent = {
      jobId: job.id,
      workspaceId: job.workspaceId,
      previousStatus: context.previousStatus,
      nextStatus: job.status,
      invoiceLink,
      timestamp: new Date(),
    };

    this.logger.log('[Notification] Job completed', event);

    // Send notifications respecting preferences
    await this.sendNotificationWithPreferences(
      customer,
      'jobCompleted',
      {
        subject: `Service completed - Invoice for ${job.title}`,
        template: 'job-completed',
        context: {
          customerName: customer.name,
          jobTitle: job.title,
          invoiceNumber: context.invoice.invoiceNumber,
          total: context.invoice.total.toString(),
          invoiceLink,
        },
      },
      {
        message: `Your service for "${job.title}" is complete! Invoice: ${context.invoice.invoiceNumber}. View at: ${invoiceLink}`,
      },
    );

    return event;
  }

  async notifyInvoiceSent(invoice: Invoice, customer: CustomerWithPreference): Promise<NotificationResult> {
    const invoiceLink = `${this.publicBaseUrl}/invoices/${invoice.id}`;

    this.logger.log('[Notification] Invoice sent', { invoiceId: invoice.id });

    const results = await this.sendNotificationWithPreferences(
      customer,
      'invoiceSent',
      {
        subject: `Invoice ${invoice.invoiceNumber} from FlexDesk`,
        template: 'invoice-sent',
        context: {
          customerName: customer.name,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.total.toString(),
          dueDate: invoice.dueDate,
          invoiceLink,
        },
      },
      {
        message: `Invoice ${invoice.invoiceNumber} for $${invoice.total} is ready. View & pay: ${invoiceLink}`,
      },
    );

    // Return email result if available, otherwise SMS result
    return results.email || results.sms || { success: false, channel: 'email', error: 'No notifications sent' };
  }

  async notifyPaymentReceived(invoice: Invoice, customer: CustomerWithPreference): Promise<NotificationResult> {
    this.logger.log('[Notification] Payment received', { invoiceId: invoice.id });

    const results = await this.sendNotificationWithPreferences(
      customer,
      'paymentReceived',
      {
        subject: `Payment confirmed - Invoice ${invoice.invoiceNumber}`,
        template: 'payment-received',
        context: {
          customerName: customer.name,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.total.toString(),
          paidAt: invoice.paidAt,
        },
      },
      {
        message: `Payment confirmed for Invoice ${invoice.invoiceNumber}. Amount: $${invoice.total}. Thank you!`,
      },
    );

    return results.email || results.sms || { success: false, channel: 'email', error: 'No notifications sent' };
  }

  async notifyEstimateSent(estimate: Estimate, customer: CustomerWithPreference): Promise<NotificationResult> {
    const estimateLink = `${this.publicBaseUrl}/estimates/${estimate.id}`;

    this.logger.log('[Notification] Estimate sent', { estimateId: estimate.id });

    const results = await this.sendNotificationWithPreferences(
      customer,
      'estimateSent',
      {
        subject: `Estimate ${estimate.estimateNumber} from FlexDesk`,
        template: 'estimate-sent',
        context: {
          customerName: customer.name,
          estimateNumber: estimate.estimateNumber,
          title: estimate.title,
          total: estimate.total.toString(),
          validUntil: estimate.validUntil,
          estimateLink,
        },
      },
      {
        message: `Estimate ${estimate.estimateNumber} for $${estimate.total} is ready. View: ${estimateLink}`,
      },
    );

    return results.email || results.sms || { success: false, channel: 'email', error: 'No notifications sent' };
  }

  async notifyJobReminder(
    job: Job,
    customer: CustomerWithPreference,
    hoursUntil: number,
  ): Promise<NotificationResult> {
    this.logger.log('[Notification] Job reminder', { jobId: job.id, hoursUntil });

    const results = await this.sendNotificationWithPreferences(
      customer,
      'jobReminder',
      {
        subject: `Reminder: Service appointment in ${hoursUntil} hours`,
        template: 'job-reminder',
        context: {
          customerName: customer.name,
          jobTitle: job.title,
          scheduledAt: job.scheduledAt,
          hoursUntil,
        },
      },
      {
        message: `Reminder: Your service appointment "${job.title}" is in ${hoursUntil} hours.`,
      },
    );

    return results.email || results.sms || { success: false, channel: 'email', error: 'No notifications sent' };
  }

  // Legacy methods for backward compatibility
  logJobDispatched(
    job: Job,
    context: { previousStatus: JobStatus },
  ): JobStatusChangeEvent {
    const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

    const token = signJobToken({
      jobId: job.id,
      workspaceId: job.workspaceId,
      exp,
    });

    const trackingLink = `${this.publicBaseUrl}/public/track/${token}`;

    const event: JobStatusChangeEvent = {
      jobId: job.id,
      workspaceId: job.workspaceId,
      previousStatus: context.previousStatus,
      nextStatus: job.status,
      trackingLink,
      timestamp: new Date(),
    };

    this.logger.log('[Notification] Job dispatched', event);

    return event;
  }

  logJobCompleted(
    job: Job,
    context: { previousStatus: JobStatus; invoice: Invoice },
  ): JobStatusChangeEvent {
    const invoiceLink = `${this.publicBaseUrl}/invoices/${context.invoice.id}`;

    const event: JobStatusChangeEvent = {
      jobId: job.id,
      workspaceId: job.workspaceId,
      previousStatus: context.previousStatus,
      nextStatus: job.status,
      invoiceLink,
      timestamp: new Date(),
    };

    this.logger.log('[Notification] Job completed', event);

    return event;
  }
}
