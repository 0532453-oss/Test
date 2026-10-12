"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const sgMail = require("@sendgrid/mail");
const twilio_1 = require("twilio");
const crypto_1 = require("../../utils/crypto");
const DEFAULT_PREFERENCES = {
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
let NotificationService = NotificationService_1 = class NotificationService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(NotificationService_1.name);
        this.isEmailConfigured = false;
        this.twilioClient = null;
        this.isSmsConfigured = false;
        this.publicBaseUrl = this.configService.get('PUBLIC_APP_URL', '');
        this.sendGridApiKey = this.configService.get('SENDGRID_API_KEY');
        this.fromEmail = this.configService.get('SENDGRID_FROM_EMAIL', 'noreply@flexdesk.io');
        this.fromName = this.configService.get('SENDGRID_FROM_NAME', 'FlexDesk');
        this.twilioAccountSid = this.configService.get('TWILIO_ACCOUNT_SID');
        this.twilioAuthToken = this.configService.get('TWILIO_AUTH_TOKEN');
        this.twilioFromNumber = this.configService.get('TWILIO_FROM_NUMBER');
    }
    onModuleInit() {
        if (this.sendGridApiKey && this.sendGridApiKey !== 'your-sendgrid-api-key') {
            sgMail.setApiKey(this.sendGridApiKey);
            this.isEmailConfigured = true;
            this.logger.log('SendGrid email client configured successfully');
        }
        else {
            this.logger.warn('SendGrid API key not configured - emails will be logged only');
        }
        if (this.twilioAccountSid &&
            this.twilioAuthToken &&
            this.twilioFromNumber &&
            this.twilioAccountSid !== '' &&
            this.twilioAuthToken !== '') {
            this.twilioClient = new twilio_1.Twilio(this.twilioAccountSid, this.twilioAuthToken);
            this.isSmsConfigured = true;
            this.logger.log('Twilio SMS client configured successfully');
        }
        else {
            this.logger.warn('Twilio not configured - SMS will be logged only');
        }
    }
    async getCustomerPreferences(customerId) {
        const preference = await this.prisma.notificationPreference.findUnique({
            where: { customerId },
        });
        return preference || DEFAULT_PREFERENCES;
    }
    async upsertCustomerPreferences(customerId, preferences) {
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
    async isNotificationEnabled(customerId, notificationType, channel) {
        const prefs = await this.getCustomerPreferences(customerId);
        const channelEnabled = (channel === 'email' && prefs.emailEnabled) ||
            (channel === 'sms' && prefs.smsEnabled) ||
            (channel === 'push' && prefs.pushEnabled);
        if (!channelEnabled) {
            return false;
        }
        return prefs[notificationType] ?? true;
    }
    isWithinQuietHours(prefs) {
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
        if (startTime > endTime) {
            return currentTime >= startTime || currentTime < endTime;
        }
        return currentTime >= startTime && currentTime < endTime;
    }
    async sendEmail(payload) {
        this.logger.log(`[Email] Sending to ${payload.to}: ${payload.subject}`);
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
                messageId: response.headers['x-message-id'],
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`[Email] Failed to send to ${payload.to}: ${errorMessage}`, error);
            return {
                success: false,
                channel: 'email',
                error: errorMessage,
            };
        }
    }
    renderEmailTemplate(template, context) {
        const templates = {
            'job-dispatched': (ctx) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Service Appointment is On the Way!</h2>
          <p>Hello ${ctx.customerName},</p>
          <p>Great news! A technician has been dispatched for your service appointment: <strong>${ctx.jobTitle}</strong></p>
          <p>Scheduled for: ${ctx.scheduledAt ? new Date(ctx.scheduledAt).toLocaleString() : 'TBD'}</p>
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
          <p>Due Date: ${ctx.dueDate ? new Date(ctx.dueDate).toLocaleDateString() : 'Upon Receipt'}</p>
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
          <p>Payment Date: ${ctx.paidAt ? new Date(ctx.paidAt).toLocaleString() : new Date().toLocaleString()}</p>
          <p>Thank you for your payment!</p>
        </div>
      `,
            'job-reminder': (ctx) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Service Reminder</h2>
          <p>Hello ${ctx.customerName},</p>
          <p>This is a friendly reminder about your upcoming service appointment:</p>
          <p><strong>${ctx.jobTitle}</strong></p>
          <p>Scheduled for: ${ctx.scheduledAt ? new Date(ctx.scheduledAt).toLocaleString() : 'TBD'}</p>
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
          <p>Valid Until: ${ctx.validUntil ? new Date(ctx.validUntil).toLocaleDateString() : 'N/A'}</p>
          <p><a href="${ctx.estimateLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">View Estimate</a></p>
          <p>Thank you for considering FlexDesk!</p>
        </div>
      `,
        };
        const templateFn = templates[template];
        if (templateFn) {
            return templateFn(context);
        }
        return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>FlexDesk Notification</h2>
        <pre>${JSON.stringify(context, null, 2)}</pre>
      </div>
    `;
    }
    async sendSms(payload) {
        this.logger.log(`[SMS] Sending to ${payload.to}`);
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`[SMS] Failed to send to ${payload.to}: ${errorMessage}`, error);
            return {
                success: false,
                channel: 'sms',
                error: errorMessage,
            };
        }
    }
    async sendNotificationWithPreferences(customer, notificationType, emailPayload, smsPayload) {
        const results = {};
        const prefs = customer.notificationPreference || DEFAULT_PREFERENCES;
        if (this.isWithinQuietHours(prefs)) {
            this.logger.debug(`[Notification] Skipping - within quiet hours for customer ${customer.id}`);
            return results;
        }
        if (!prefs[notificationType]) {
            this.logger.debug(`[Notification] Skipping - ${notificationType} disabled for customer ${customer.id}`);
            return results;
        }
        if (emailPayload && prefs.emailEnabled && customer.email) {
            results.email = await this.sendEmail({
                ...emailPayload,
                to: customer.email,
            });
        }
        if (smsPayload && prefs.smsEnabled && customer.phone) {
            results.sms = await this.sendSms({
                ...smsPayload,
                to: customer.phone,
            });
        }
        return results;
    }
    async notifyJobDispatched(job, customer, context) {
        const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
        const token = (0, crypto_1.signJobToken)({
            jobId: job.id,
            workspaceId: job.workspaceId,
            exp,
        });
        const trackingLink = `${this.publicBaseUrl}/public/track/${token}`;
        const event = {
            jobId: job.id,
            workspaceId: job.workspaceId,
            previousStatus: context.previousStatus,
            nextStatus: job.status,
            trackingLink,
            timestamp: new Date(),
        };
        this.logger.log('[Notification] Job dispatched', event);
        await this.sendNotificationWithPreferences(customer, 'jobDispatched', {
            subject: `Your service appointment is on the way - ${job.title}`,
            template: 'job-dispatched',
            context: {
                customerName: customer.name,
                jobTitle: job.title,
                scheduledAt: job.scheduledAt,
                trackingLink,
            },
        }, {
            message: `Your technician is on the way! Track their arrival: ${trackingLink}`,
        });
        return event;
    }
    async notifyJobCompleted(job, customer, context) {
        const invoiceLink = `${this.publicBaseUrl}/invoices/${context.invoice.id}`;
        const event = {
            jobId: job.id,
            workspaceId: job.workspaceId,
            previousStatus: context.previousStatus,
            nextStatus: job.status,
            invoiceLink,
            timestamp: new Date(),
        };
        this.logger.log('[Notification] Job completed', event);
        await this.sendNotificationWithPreferences(customer, 'jobCompleted', {
            subject: `Service completed - Invoice for ${job.title}`,
            template: 'job-completed',
            context: {
                customerName: customer.name,
                jobTitle: job.title,
                invoiceNumber: context.invoice.invoiceNumber,
                total: context.invoice.total.toString(),
                invoiceLink,
            },
        }, {
            message: `Your service for "${job.title}" is complete! Invoice: ${context.invoice.invoiceNumber}. View at: ${invoiceLink}`,
        });
        return event;
    }
    async notifyInvoiceSent(invoice, customer) {
        const invoiceLink = `${this.publicBaseUrl}/invoices/${invoice.id}`;
        this.logger.log('[Notification] Invoice sent', { invoiceId: invoice.id });
        const results = await this.sendNotificationWithPreferences(customer, 'invoiceSent', {
            subject: `Invoice ${invoice.invoiceNumber} from FlexDesk`,
            template: 'invoice-sent',
            context: {
                customerName: customer.name,
                invoiceNumber: invoice.invoiceNumber,
                amount: invoice.total.toString(),
                dueDate: invoice.dueDate,
                invoiceLink,
            },
        }, {
            message: `Invoice ${invoice.invoiceNumber} for $${invoice.total} is ready. View & pay: ${invoiceLink}`,
        });
        return results.email || results.sms || { success: false, channel: 'email', error: 'No notifications sent' };
    }
    async notifyPaymentReceived(invoice, customer) {
        this.logger.log('[Notification] Payment received', { invoiceId: invoice.id });
        const results = await this.sendNotificationWithPreferences(customer, 'paymentReceived', {
            subject: `Payment confirmed - Invoice ${invoice.invoiceNumber}`,
            template: 'payment-received',
            context: {
                customerName: customer.name,
                invoiceNumber: invoice.invoiceNumber,
                amount: invoice.total.toString(),
                paidAt: invoice.paidAt,
            },
        }, {
            message: `Payment confirmed for Invoice ${invoice.invoiceNumber}. Amount: $${invoice.total}. Thank you!`,
        });
        return results.email || results.sms || { success: false, channel: 'email', error: 'No notifications sent' };
    }
    async notifyJobReminder(job, customer, hoursUntil) {
        this.logger.log('[Notification] Job reminder', { jobId: job.id, hoursUntil });
        const results = await this.sendNotificationWithPreferences(customer, 'jobReminder', {
            subject: `Reminder: Service appointment in ${hoursUntil} hours`,
            template: 'job-reminder',
            context: {
                customerName: customer.name,
                jobTitle: job.title,
                scheduledAt: job.scheduledAt,
                hoursUntil,
            },
        }, {
            message: `Reminder: Your service appointment "${job.title}" is in ${hoursUntil} hours.`,
        });
        return results.email || results.sms || { success: false, channel: 'email', error: 'No notifications sent' };
    }
    logJobDispatched(job, context) {
        const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
        const token = (0, crypto_1.signJobToken)({
            jobId: job.id,
            workspaceId: job.workspaceId,
            exp,
        });
        const trackingLink = `${this.publicBaseUrl}/public/track/${token}`;
        const event = {
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
    logJobCompleted(job, context) {
        const invoiceLink = `${this.publicBaseUrl}/invoices/${context.invoice.id}`;
        const event = {
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
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function, Function])
], NotificationService);
