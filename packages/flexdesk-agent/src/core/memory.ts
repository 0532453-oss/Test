/**
 * Memory System
 *
 * Persistent memory for conversations, customer preferences,
 * and learned patterns.
 */

import { ConversationContext, Customer } from '../types';
import { Logger } from './logger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Sanitize a string for use as a filename to prevent path traversal attacks.
 * Only allows alphanumeric characters, hyphens, and underscores.
 */
function sanitizeFilename(input: string): string {
  const sanitized = input.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!sanitized) {
    throw new Error('Invalid filename: sanitization produced empty string');
  }
  return sanitized;
}

export class MemorySystem {
  private dataDir: string;
  private conversations: Map<string, ConversationContext> = new Map();
  private customers: Map<string, Customer> = new Map();
  private logger = new Logger('Memory');

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
    this.ensureDataDir();
    this.loadFromDisk();
  }

  private ensureDataDir(): void {
    const dirs = [
      this.dataDir,
      path.join(this.dataDir, 'conversations'),
      path.join(this.dataDir, 'customers'),
      path.join(this.dataDir, 'memory')
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  private loadFromDisk(): void {
    // Load active conversations
    const convDir = path.join(this.dataDir, 'conversations');
    if (fs.existsSync(convDir)) {
      const files = fs.readdirSync(convDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const data = fs.readFileSync(path.join(convDir, file), 'utf-8');
            const context = JSON.parse(data) as ConversationContext;
            this.conversations.set(context.customerPhone, context);
          } catch (error) {
            this.logger.error(`Failed to load conversation ${file}:`, error);
          }
        }
      }
    }

    this.logger.info(`Loaded ${this.conversations.size} active conversations`);
  }

  /**
   * Get or create conversation context for a phone number
   */
  async getConversation(phone: string): Promise<ConversationContext> {
    let context = this.conversations.get(phone);

    if (!context) {
      context = {
        customerPhone: phone,
        messages: [],
        extractedData: {},
        status: 'active'
      };
      this.conversations.set(phone, context);
    }

    return context;
  }

  /**
   * Save conversation context
   */
  async saveConversation(context: ConversationContext): Promise<void> {
    this.conversations.set(context.customerPhone, context);

    // Persist to disk
    const filename = `${sanitizeFilename(context.customerPhone)}.json`;
    const filepath = path.join(this.dataDir, 'conversations', filename);

    fs.writeFileSync(filepath, JSON.stringify(context, null, 2));
  }

  /**
   * Mark conversation as completed
   */
  async completeConversation(phone: string): Promise<void> {
    const context = this.conversations.get(phone);
    if (context) {
      context.status = 'completed';
      await this.saveConversation(context);

      // Archive after some time
      setTimeout(() => {
        this.archiveConversation(phone);
      }, 24 * 60 * 60 * 1000); // 24 hours
    }
  }

  /**
   * Archive old conversation
   */
  private async archiveConversation(phone: string): Promise<void> {
    const context = this.conversations.get(phone);
    if (context && context.status === 'completed') {
      // Move to archive
      const filename = `${sanitizeFilename(phone)}.json`;
      const archiveDir = path.join(this.dataDir, 'archive');

      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }

      fs.writeFileSync(
        path.join(archiveDir, `${Date.now()}-${filename}`),
        JSON.stringify(context, null, 2)
      );

      // Remove from active
      this.conversations.delete(phone);
      fs.unlinkSync(path.join(this.dataDir, 'conversations', filename));
    }
  }

  /**
   * Get customer by phone
   */
  async getCustomer(phone: string): Promise<Customer | undefined> {
    return this.customers.get(phone);
  }

  /**
   * Save customer
   */
  async saveCustomer(customer: Customer): Promise<void> {
    this.customers.set(customer.phone, customer);

    const filename = `${sanitizeFilename(customer.phone)}.json`;
    const filepath = path.join(this.dataDir, 'customers', filename);

    fs.writeFileSync(filepath, JSON.stringify(customer, null, 2));
  }

  /**
   * Store a memory/learning
   */
  async remember(key: string, value: any): Promise<void> {
    const filepath = path.join(this.dataDir, 'memory', `${sanitizeFilename(key)}.json`);
    fs.writeFileSync(
      filepath,
      JSON.stringify(
        {
          key,
          value,
          timestamp: new Date().toISOString()
        },
        null,
        2
      )
    );
  }

  /**
   * Recall a memory
   */
  async recall(key: string): Promise<any | undefined> {
    const filepath = path.join(this.dataDir, 'memory', `${sanitizeFilename(key)}.json`);
    if (fs.existsSync(filepath)) {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      return data.value;
    }
    return undefined;
  }

  /**
   * Get conversation history for a customer
   */
  async getHistory(phone: string): Promise<ConversationContext[]> {
    const history: ConversationContext[] = [];

    // Check archive
    const archiveDir = path.join(this.dataDir, 'archive');
    if (fs.existsSync(archiveDir)) {
      const files = fs.readdirSync(archiveDir);
      const phoneClean = sanitizeFilename(phone);

      for (const file of files) {
        if (file.includes(phoneClean)) {
          const data = fs.readFileSync(path.join(archiveDir, file), 'utf-8');
          history.push(JSON.parse(data));
        }
      }
    }

    // Add current conversation if exists
    const current = this.conversations.get(phone);
    if (current) {
      history.push(current);
    }

    return history.sort(
      (a, b) =>
        new Date(a.messages[0]?.timestamp || 0).getTime() -
        new Date(b.messages[0]?.timestamp || 0).getTime()
    );
  }

  /**
   * Get stats for reporting
   */
  async getStats(): Promise<{
    activeConversations: number;
    totalCustomers: number;
    conversationsToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let conversationsToday = 0;
    for (const [, context] of this.conversations) {
      const lastMessage = context.messages[context.messages.length - 1];
      if (lastMessage && new Date(lastMessage.timestamp) >= today) {
        conversationsToday++;
      }
    }

    return {
      activeConversations: this.conversations.size,
      totalCustomers: this.customers.size,
      conversationsToday
    };
  }
}
