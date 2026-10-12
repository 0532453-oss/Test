/**
 * Conversation Handler
 *
 * Processes incoming messages and determines appropriate responses.
 * Uses AI to understand intent and extract booking information.
 */

import {
  AgentConfig,
  ConversationContext,
  ConversationIntent,
  Booking
} from '../types';
import { Logger } from './logger';

interface ConversationResponse {
  message: string;
  action?: {
    type: string;
    data: any;
  };
}

export class ConversationHandler {
  private config: AgentConfig;
  private logger = new Logger('Conversation');

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async process(context: ConversationContext): Promise<ConversationResponse> {
    const lastMessage = context.messages[context.messages.length - 1];

    // Determine intent if not already set
    if (!context.intent) {
      context.intent = await this.detectIntent(lastMessage.content);
      this.logger.debug('Intent detected', { intent: context.intent, message: lastMessage.content });
    }

    this.logger.debug('Processing message', {
      intent: context.intent,
      messageCount: context.messages.length,
      extractedData: context.extractedData,
    });

    // Route based on intent
    switch (context.intent) {
      case 'book_service':
        return this.handleBookingFlow(context, lastMessage.content);
      case 'emergency':
        return this.handleEmergency(context, lastMessage.content);
      case 'get_quote':
        return this.handleQuoteRequest(context, lastMessage.content);
      case 'reschedule':
        return this.handleReschedule(context, lastMessage.content);
      case 'cancel':
        return this.handleCancellation(context, lastMessage.content);
      case 'question':
        return this.handleQuestion(context, lastMessage.content);
      default:
        return this.handleUnknown(context, lastMessage.content);
    }
  }

  private async detectIntent(message: string): Promise<ConversationIntent> {
    const lower = message.toLowerCase();

    // Emergency keywords
    if (
      lower.includes('emergency') ||
      lower.includes('urgent') ||
      lower.includes('no heat') ||
      lower.includes('no ac') ||
      lower.includes('flooding') ||
      lower.includes('gas smell')
    ) {
      return 'emergency';
    }

    // Booking keywords
    if (
      lower.includes('appointment') ||
      lower.includes('schedule') ||
      lower.includes('come out') ||
      lower.includes('service') ||
      lower.includes('broken') ||
      lower.includes('not working') ||
      lower.includes('fix')
    ) {
      return 'book_service';
    }

    // Quote keywords
    if (
      lower.includes('quote') ||
      lower.includes('estimate') ||
      lower.includes('how much') ||
      lower.includes('price') ||
      lower.includes('cost')
    ) {
      return 'get_quote';
    }

    // Reschedule
    if (lower.includes('reschedule') || lower.includes('change appointment')) {
      return 'reschedule';
    }

    // Cancel
    if (lower.includes('cancel')) {
      return 'cancel';
    }

    // Questions
    if (
      lower.includes('?') ||
      lower.includes('do you') ||
      lower.includes('can you') ||
      lower.includes('what')
    ) {
      return 'question';
    }

    return 'unknown';
  }

  private async handleBookingFlow(
    context: ConversationContext,
    message: string
  ): Promise<ConversationResponse> {
    const data = context.extractedData;

    // Extract information from message
    this.extractBookingInfo(message, data);

    // Check what we still need
    if (!data.address) {
      return {
        message: "I'd be happy to get you scheduled. What's your address?"
      };
    }

    if (!data.issue) {
      return {
        message:
          "Got it. Can you briefly describe the issue you're experiencing?"
      };
    }

    if (!data.scheduledAt) {
      // TODO: Check calendar for availability
      const slots = await this.getAvailableSlots();
      return {
        message: `Thanks for that info. We have availability ${slots}. Which works better for you?`
      };
    }

    // We have everything - book it
    return {
      message: `Perfect! You're all set for ${this.formatDateTime(data.scheduledAt)}. Our technician will call 15 minutes before arrival. Reply to this number if you need to reschedule.`,
      action: {
        type: 'book_appointment',
        data: {
          customerName: data.customerName || 'Customer',
          address: data.address,
          issue: data.issue,
          scheduledAt: data.scheduledAt,
          notes: message
        }
      }
    };
  }

  private async handleEmergency(
    context: ConversationContext,
    message: string
  ): Promise<ConversationResponse> {
    if (!this.config.emergencyEnabled) {
      return {
        message: `We don't offer after-hours emergency service, but we can get you first thing tomorrow morning. Would 8 AM work?`
      };
    }

    return {
      message: `I understand this is urgent. We can have someone there within the hour. Emergency after-hours rate is $${this.config.emergencyFee} call-out fee plus repairs. Reply YES to confirm and we'll dispatch immediately.`,
      action: {
        type: 'notify_owner',
        data: {
          type: 'emergency_request',
          phone: context.customerPhone,
          message
        }
      }
    };
  }

  private async handleQuoteRequest(
    context: ConversationContext,
    message: string
  ): Promise<ConversationResponse> {
    return {
      message: `I'd be happy to get you a quote. Can you describe what you need done? Our technician can provide an exact quote on-site, or I can have someone call you with a ballpark figure.`,
      action: {
        type: 'notify_owner',
        data: {
          type: 'quote_request',
          phone: context.customerPhone,
          message
        }
      }
    };
  }

  private async handleReschedule(
    context: ConversationContext,
    message: string
  ): Promise<ConversationResponse> {
    return {
      message: `No problem - let me help you reschedule. What day and time works better for you?`
    };
  }

  private async handleCancellation(
    context: ConversationContext,
    message: string
  ): Promise<ConversationResponse> {
    return {
      message: `I've noted your cancellation request. Is there anything we can do to help, or would you like to reschedule for a different time?`,
      action: {
        type: 'notify_owner',
        data: {
          type: 'cancellation',
          phone: context.customerPhone,
          message
        }
      }
    };
  }

  private async handleQuestion(
    context: ConversationContext,
    message: string
  ): Promise<ConversationResponse> {
    // TODO: Use AI to answer common questions
    return {
      message: `Great question! Let me find that out for you. Someone will get back to you shortly, or you can call us at ${this.config.businessPhone}.`
    };
  }

  private async handleUnknown(
    context: ConversationContext,
    message: string
  ): Promise<ConversationResponse> {
    return {
      message: `Thanks for reaching out to ${this.config.businessName}! Are you looking to schedule a service appointment, or do you have a question I can help with?`
    };
  }

  private extractBookingInfo(message: string, data: Partial<Booking>): void {
    // Extract zip code
    const zipMatch = message.match(/\b\d{5}(?:-\d{4})?\b/);
    if (zipMatch) {
      data.address = data.address || zipMatch[0];
    }

    // Extract time preferences
    const timePatterns = [
      /today at (\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
      /tomorrow at (\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
      /(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i
    ];

    for (const pattern of timePatterns) {
      const match = message.match(pattern);
      if (match) {
        // TODO: Parse into actual date
        break;
      }
    }

    // Extract address (basic pattern)
    const addressMatch = message.match(
      /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|court|ct|boulevard|blvd)/i
    );
    if (addressMatch) {
      data.address = addressMatch[0];
    }
  }

  private async getAvailableSlots(): Promise<string> {
    // TODO: Check actual calendar
    return 'today at 4 PM or tomorrow at 9 AM';
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
}
