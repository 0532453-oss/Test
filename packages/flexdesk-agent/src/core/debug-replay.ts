/**
 * Conversation Replay Utility
 *
 * Replays a saved conversation from disk through the ConversationHandler,
 * logging each step for debugging intent detection, flow transitions,
 * and action triggers.
 *
 * Usage:
 *   const replay = new ConversationReplay();
 *   await replay.replayFromFile('./data/conversations/14805551234.json', handler);
 */

import * as fs from 'fs';
import { ConversationHandler } from './conversation';
import { Logger } from './logger';
import { ConversationContext } from '../types';

export class ConversationReplay {
  private logger = new Logger('Replay');

  /**
   * Replay a conversation from a JSON file.
   * Processes each customer message through the handler and logs the result.
   */
  async replayFromFile(
    conversationFile: string,
    handler: ConversationHandler,
  ): Promise<void> {
    if (!fs.existsSync(conversationFile)) {
      this.logger.error(`File not found: ${conversationFile}`);
      return;
    }

    const raw = fs.readFileSync(conversationFile, 'utf-8');
    const savedContext = JSON.parse(raw) as ConversationContext;

    this.logger.info('Starting replay', {
      file: conversationFile,
      customerPhone: savedContext.customerPhone,
      messageCount: savedContext.messages.length,
    });

    // Create a fresh context for replay
    const replayContext: ConversationContext = {
      customerPhone: savedContext.customerPhone,
      messages: [],
      extractedData: {},
      status: 'active',
    };

    let messageIndex = 0;

    for (const msg of savedContext.messages) {
      messageIndex++;

      if (msg.role === 'customer') {
        // Add customer message to context
        replayContext.messages.push(msg);

        this.logger.info(`[${messageIndex}] Customer: ${msg.content}`);

        // Process through handler
        const startTime = Date.now();
        const response = await handler.process(replayContext);
        const durationMs = Date.now() - startTime;

        this.logger.info(`[${messageIndex}] Agent (${durationMs}ms): ${response.message}`);

        if (response.action) {
          this.logger.info(`[${messageIndex}] Action triggered`, {
            type: response.action.type,
            data: response.action.data,
          });
        }

        // Add agent response to context
        replayContext.messages.push({
          role: 'agent',
          content: response.message,
          timestamp: new Date(),
        });

        this.logger.debug(`[${messageIndex}] Context state`, {
          intent: replayContext.intent,
          extractedData: replayContext.extractedData,
          messageCount: replayContext.messages.length,
        });
      }
    }

    this.logger.info('Replay complete', {
      totalMessages: messageIndex,
      finalIntent: replayContext.intent,
      extractedData: replayContext.extractedData,
    });
  }

  /**
   * Replay from an in-memory context object (useful for testing).
   */
  async replayFromContext(
    savedContext: ConversationContext,
    handler: ConversationHandler,
  ): Promise<Array<{ input: string; output: string; action?: { type: string; data: unknown } }>> {
    const results: Array<{ input: string; output: string; action?: { type: string; data: unknown } }> = [];

    const replayContext: ConversationContext = {
      customerPhone: savedContext.customerPhone,
      messages: [],
      extractedData: {},
      status: 'active',
    };

    for (const msg of savedContext.messages) {
      if (msg.role === 'customer') {
        replayContext.messages.push(msg);

        const response = await handler.process(replayContext);

        results.push({
          input: msg.content,
          output: response.message,
          action: response.action,
        });

        replayContext.messages.push({
          role: 'agent',
          content: response.message,
          timestamp: new Date(),
        });
      }
    }

    return results;
  }
}
