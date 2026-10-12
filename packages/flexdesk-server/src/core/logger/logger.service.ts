/**
 * Structured JSON Logger
 *
 * Implements NestJS LoggerService to output structured JSON logs
 * enriched with per-request context (requestId, workspaceId, userId, etc.)
 * from AsyncLocalStorage.
 */

import { LoggerService, LogLevel } from '@nestjs/common';

import { getWorkspaceId } from '../database/workspace-context';
import { getRequestContext } from '../middleware/correlation-id.context';

interface StructuredLog {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  requestId?: string;
  workspaceId?: string;
  userId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  error?: string;
  stack?: string;
}

export class StructuredLogger implements LoggerService {
  private static instance: StructuredLogger;

  static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger();
    }
    return StructuredLogger.instance;
  }

  log(message: unknown, context?: string): void {
    this.writeLog('info', message, context);
  }

  error(message: unknown, stackOrContext?: string, context?: string): void {
    const hasStack = stackOrContext && !context && stackOrContext.includes('\n');
    this.writeLog(
      'error',
      message,
      hasStack ? context : stackOrContext,
      hasStack ? stackOrContext : undefined,
    );
  }

  warn(message: unknown, context?: string): void {
    this.writeLog('warn', message, context);
  }

  debug?(message: unknown, context?: string): void {
    this.writeLog('debug', message, context);
  }

  verbose?(message: unknown, context?: string): void {
    this.writeLog('verbose', message, context);
  }

  fatal?(message: unknown, context?: string): void {
    this.writeLog('fatal', message, context);
  }

  setLogLevels?(_levels: LogLevel[]): void {
    // No-op — Railway reads all log output
  }

  private writeLog(
    level: string,
    message: unknown,
    context?: string,
    stack?: string,
  ): void {
    const reqCtx = getRequestContext();
    const workspaceId = getWorkspaceId();

    const entry: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message: typeof message === 'string' ? message : JSON.stringify(message),
    };

    if (context) entry.context = context;
    if (reqCtx?.correlationId) entry.requestId = reqCtx.correlationId;
    if (workspaceId) entry.workspaceId = workspaceId;
    if (reqCtx?.userId) entry.userId = reqCtx.userId;
    if (reqCtx?.method) entry.method = reqCtx.method;
    if (reqCtx?.url) entry.url = reqCtx.url;
    if (stack) {
      entry.stack = stack;
      entry.error = typeof message === 'string' ? message : undefined;
    }

    const output = JSON.stringify(entry);

    if (level === 'error' || level === 'fatal') {
      process.stderr.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }
  }
}
