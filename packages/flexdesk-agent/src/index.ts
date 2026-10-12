/**
 * FlexDesk Agent
 *
 * 24/7 AI Agent for service businesses
 * Powered by OpenClaw
 *
 * Features:
 * - Handles customer texts/calls
 * - Books appointments automatically
 * - Syncs with CRM (Airtable or FlexDesk)
 * - Sends daily briefs
 * - Manages follow-ups
 */

import { config } from 'dotenv';
config();

import { Logger, LogLevel } from './core/logger';

// Configure logger from environment
if (process.env.FLEXDESK_DEBUG === 'true' || process.argv.includes('--debug')) {
  Logger.configure({ level: LogLevel.DEBUG });
}
if (process.env.FLEXDESK_LOG_JSON === 'true') {
  Logger.configure({ json: true });
}

// Core exports
export * from './types';
export * from './core/agent';
export * from './core/conversation';
export * from './core/scheduler';
export * from './core/memory';
export * from './core/logger';

// Skills
export * from './skills/twilio';
export * from './skills/calendar';
export * from './skills/airtable';
export * from './skills/flexdesk';

// Templates
export * from './templates/daily-brief';
export * from './templates/confirmations';

// Prompts
export * from './prompts/hvac';

// Main entry point
import { FlexDeskAgent } from './core/agent';

const bootLogger = new Logger('Boot');

async function main() {
  bootLogger.info('Starting FlexDesk Agent...', { debugMode: Logger.getLevel() === LogLevel.DEBUG });

  const agent = new FlexDeskAgent({
    name: process.env.AGENT_NAME || 'Dispatch',
    businessName: process.env.BUSINESS_NAME || 'Your Business',
    businessPhone: process.env.BUSINESS_PHONE || '',
    timezone: process.env.AGENT_TIMEZONE || 'America/Phoenix',
    industry: 'hvac',
    workingHours: {
      start: '08:00',
      end: '17:00',
      days: [1, 2, 3, 4, 5] // Mon-Fri
    },
    emergencyEnabled: true,
    emergencyFee: 250,
    defaultJobDuration: 60,
    confirmationTemplate: 'default',
    briefTime: '07:00'
  });

  await agent.start();

  bootLogger.info(`${agent.config.name} is now running 24/7`);
}

// Run if called directly
if (require.main === module) {
  main().catch((err) => bootLogger.error('Fatal startup error', err));
}
