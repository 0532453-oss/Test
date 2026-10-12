/**
 * FlexDesk Agent Core
 *
 * Main agent class that orchestrates all skills and handles
 * the conversation loop.
 */

import { AgentConfig, ConversationContext, Message } from '../types';
import { ConversationHandler } from './conversation';
import { Scheduler } from './scheduler';
import { MemorySystem } from './memory';
import { Logger } from './logger';
import { TwilioSkill } from '../skills/twilio';
import { CalendarSkill } from '../skills/calendar';
import { AirtableSkill } from '../skills/airtable';
import { FlexDeskSkill } from '../skills/flexdesk';

export class FlexDeskAgent {
  public config: AgentConfig;
  private conversationHandler: ConversationHandler;
  private scheduler: Scheduler;
  private memory: MemorySystem;
  private logger: Logger;

  // Skills
  private twilioSkill?: TwilioSkill;
  private calendarSkill?: CalendarSkill;
  private crmSkill?: AirtableSkill | FlexDeskSkill;

  constructor(config: AgentConfig) {
    this.config = config;
    this.conversationHandler = new ConversationHandler(config);
    this.scheduler = new Scheduler(config);
    this.memory = new MemorySystem();
    this.logger = new Logger(config.name);
  }

  async start(): Promise<void> {
    this.logger.info('Initializing agent...');

    // Initialize skills based on environment
    await this.initializeSkills();

    // Set up scheduled tasks
    this.scheduler.scheduleDailyBrief(this.config.briefTime, () => {
      this.sendDailyBrief();
    });

    // Start listening for messages
    if (this.twilioSkill) {
      this.twilioSkill.onMessage((from, body) => {
        this.handleIncomingMessage(from, body);
      });
    }

    this.logger.info('Agent started successfully');
  }

  private async initializeSkills(): Promise<void> {
    // Twilio for SMS
    if (process.env.TWILIO_ACCOUNT_SID) {
      this.twilioSkill = new TwilioSkill({
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN!,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER!
      });
      this.logger.info('Twilio skill initialized');
    }

    // Calendar
    if (process.env.GOOGLE_CLIENT_ID) {
      this.calendarSkill = new CalendarSkill({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: process.env.GOOGLE_REDIRECT_URI!
      });
      this.logger.info('Calendar skill initialized');
    }

    // CRM - FlexDesk or Airtable
    if (process.env.FLEXDESK_API_URL) {
      this.crmSkill = new FlexDeskSkill({
        apiUrl: process.env.FLEXDESK_API_URL,
        apiKey: process.env.FLEXDESK_API_KEY!
      });
      this.logger.info('FlexDesk CRM skill initialized');
    } else if (process.env.AIRTABLE_API_KEY) {
      this.crmSkill = new AirtableSkill({
        apiKey: process.env.AIRTABLE_API_KEY,
        baseId: process.env.AIRTABLE_BASE_ID!,
        customersTable: 'Customers',
        jobsTable: 'Jobs'
      });
      this.logger.info('Airtable CRM skill initialized');
    }
  }

  async handleIncomingMessage(from: string, body: string): Promise<void> {
    this.logger.info(`Message from ${from}`, { bodyLength: body.length });
    this.logger.debug('Message content', { from, body });

    // Get or create conversation context
    const context = await this.memory.getConversation(from);

    // Add message to context
    context.messages.push({
      role: 'customer',
      content: body,
      timestamp: new Date()
    });

    // Process with conversation handler
    const response = await this.conversationHandler.process(context);

    // Send response
    if (this.twilioSkill) {
      await this.twilioSkill.sendMessage(from, response.message);
    }

    // Add response to context
    context.messages.push({
      role: 'agent',
      content: response.message,
      timestamp: new Date()
    });

    // Handle any actions (booking, etc)
    if (response.action) {
      await this.executeAction(response.action, context);
    }

    // Save updated context
    await this.memory.saveConversation(context);
  }

  private async executeAction(
    action: { type: string; data: any },
    context: ConversationContext
  ): Promise<void> {
    this.logger.debug('Executing action', { type: action.type, data: action.data });
    switch (action.type) {
      case 'book_appointment':
        await this.bookAppointment(action.data, context);
        break;
      case 'notify_owner':
        await this.notifyOwner(action.data);
        break;
      case 'create_customer':
        await this.createCustomer(action.data);
        break;
    }
  }

  private async bookAppointment(
    data: any,
    context: ConversationContext
  ): Promise<void> {
    // Add to calendar
    if (this.calendarSkill) {
      await this.calendarSkill.createEvent({
        title: `${this.config.businessName} - ${data.issue}`,
        description: data.notes,
        start: data.scheduledAt,
        duration: this.config.defaultJobDuration,
        location: data.address
      });
    }

    // Add to CRM
    if (this.crmSkill) {
      await this.crmSkill.createJob({
        customerPhone: context.customerPhone,
        customerName: data.customerName,
        address: data.address,
        issue: data.issue,
        scheduledAt: data.scheduledAt
      });
    }

    // Notify owner
    await this.notifyOwner({
      type: 'new_booking',
      customer: data.customerName,
      phone: context.customerPhone,
      address: data.address,
      issue: data.issue,
      time: data.scheduledAt
    });
  }

  private async createCustomer(data: any): Promise<void> {
    if (this.crmSkill) {
      await this.crmSkill.createCustomer(data);
    }
  }

  private async notifyOwner(data: any): Promise<void> {
    // TODO: Send notification via Telegram/iMessage
    this.logger.info('Owner notification', { notificationType: data.type });
  }

  private async sendDailyBrief(): Promise<void> {
    // TODO: Generate and send daily brief
    this.logger.info('Sending daily brief...');
  }

  async stop(): Promise<void> {
    this.logger.info('Shutting down...');
    this.scheduler.stopAll();
  }
}
