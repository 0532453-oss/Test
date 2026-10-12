/**
 * Twilio Skill
 *
 * Handles SMS and voice communication with customers.
 */

import { TwilioConfig } from '../../types';

type MessageHandler = (from: string, body: string) => void | Promise<void>;

/**
 * Escape XML special characters to prevent TwiML injection
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export class TwilioSkill {
  private config: TwilioConfig;
  private client: { messages: { create: (opts: Record<string, unknown>) => Promise<{ sid: string }>; list: (opts: Record<string, unknown>) => Promise<Array<{ direction: string; body: string; dateSent: string }>> }; calls: { create: (opts: Record<string, unknown>) => Promise<{ sid: string }> } } | null = null;
  private messageHandlers: MessageHandler[] = [];

  constructor(config: TwilioConfig) {
    this.config = config;
    this.initializeClient();
  }

  private initializeClient(): void {
    try {
      // Dynamic import to avoid issues if twilio not installed
      const twilio = require('twilio');
      this.client = twilio(this.config.accountSid, this.config.authToken);
      console.log('[TwilioSkill] Client initialized');
    } catch (error) {
      console.error('[TwilioSkill] Failed to initialize:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Send an SMS message
   */
  async sendMessage(to: string, body: string): Promise<boolean> {
    if (!this.client) {
      console.error('[TwilioSkill] Client not initialized');
      return false;
    }

    try {
      const message = await this.client.messages.create({
        body,
        from: this.config.phoneNumber,
        to
      });

      console.log(`[TwilioSkill] Message sent: ${message.sid}`);
      return true;
    } catch (error) {
      console.error('[TwilioSkill] Failed to send message:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Register a handler for incoming messages
   */
  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Process incoming webhook from Twilio
   * Call this from your webhook endpoint
   */
  async handleIncomingWebhook(body: {
    From: string;
    Body: string;
    MessageSid: string;
  }): Promise<void> {
    console.log(`[TwilioSkill] Incoming message from ${body.From}`);

    for (const handler of this.messageHandlers) {
      try {
        await handler(body.From, body.Body);
      } catch (error) {
        console.error('[TwilioSkill] Handler error:', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Get message history for a phone number
   */
  async getMessageHistory(
    phone: string,
    limit: number = 50
  ): Promise<
    Array<{
      direction: 'inbound' | 'outbound';
      body: string;
      dateSent: Date;
    }>
  > {
    if (!this.client) {
      return [];
    }

    try {
      const messages = await this.client.messages.list({
        to: phone,
        limit
      });

      const fromMessages = await this.client.messages.list({
        from: phone,
        limit
      });

      const all = [...messages, ...fromMessages]
        .map((m) => ({
          direction: m.direction.includes('inbound')
            ? ('inbound' as const)
            : ('outbound' as const),
          body: m.body,
          dateSent: new Date(m.dateSent)
        }))
        .sort((a, b) => a.dateSent.getTime() - b.dateSent.getTime());

      return all;
    } catch (error) {
      console.error('[TwilioSkill] Failed to get history:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  /**
   * Make an outbound call
   */
  async makeCall(
    to: string,
    message: string
  ): Promise<{ success: boolean; callSid?: string }> {
    if (!this.client) {
      return { success: false };
    }

    try {
      const call = await this.client.calls.create({
        twiml: `<Response><Say>${escapeXml(message)}</Say></Response>`,
        from: this.config.phoneNumber,
        to
      });

      return { success: true, callSid: call.sid };
    } catch (error) {
      console.error('[TwilioSkill] Failed to make call:', error instanceof Error ? error.message : 'Unknown error');
      return { success: false };
    }
  }

  /**
   * Get the configured phone number
   */
  getPhoneNumber(): string {
    return this.config.phoneNumber;
  }
}

/**
 * Validate that an incoming request actually came from Twilio using the
 * X-Twilio-Signature header. Requires the request URL and auth token.
 *
 * @see https://www.twilio.com/docs/usage/security#validating-requests
 */
function validateTwilioSignature(
  authToken: string,
  signature: string | undefined,
  url: string,
  params: Record<string, string>,
): boolean {
  if (!signature) return false;
  try {
    const twilio = require('twilio');
    return twilio.validateRequest(authToken, signature, url, params);
  } catch {
    return false;
  }
}

/**
 * Express webhook handler helper.
 *
 * WARNING: The `webhookUrl` parameter MUST be provided so that Twilio
 * request signature validation can be performed. Without it, any caller
 * can forge webhook requests to this endpoint.
 */
export function createTwilioWebhookHandler(
  skill: TwilioSkill,
  options: { authToken: string; webhookUrl: string },
) {
  return async (req: any, res: any) => {
    // Validate that the request actually came from Twilio
    const signature = req.headers['x-twilio-signature'] as string | undefined;
    if (
      !validateTwilioSignature(
        options.authToken,
        signature,
        options.webhookUrl,
        req.body,
      )
    ) {
      console.error('[TwilioWebhook] Invalid Twilio signature – rejecting request');
      res.status(403).send('Forbidden');
      return;
    }

    await skill.handleIncomingWebhook(req.body);

    // Respond with empty TwiML to acknowledge
    res.type('text/xml');
    res.send('<Response></Response>');
  };
}
