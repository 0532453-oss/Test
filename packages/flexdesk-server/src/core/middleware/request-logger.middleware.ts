/**
 * Request Logger Middleware
 *
 * Logs every HTTP request as structured JSON with method, path,
 * status code, response time, workspace ID, user ID, and request ID.
 */

import { Injectable, type NestMiddleware } from '@nestjs/common';
import { type Request, type Response, type NextFunction } from 'express';

import { getWorkspaceId } from '../database/workspace-context';
import { StructuredLogger } from '../logger/logger.service';

import {
  generateCorrelationId,
  runWithCorrelationId,
  setRequestContext,
} from './correlation-id.context';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = StructuredLogger.getInstance();

  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId =
      (req.headers['x-correlation-id'] as string) || generateCorrelationId();
    const startTime = Date.now();

    // Set correlation ID on the response header
    res.setHeader('x-correlation-id', correlationId);

    runWithCorrelationId(correlationId, () => {
      // Store method/url in context for other loggers to access
      setRequestContext({
        method: req.method,
        url: req.originalUrl,
      });

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const workspaceId = getWorkspaceId() || undefined;
        const user = (req as unknown as Record<string, unknown>).user as
          | { id?: string }
          | undefined;

        // Update context with userId (available after auth guard runs)
        if (user?.id) {
          setRequestContext({ userId: user.id });
        }

        const { method, originalUrl } = req;
        const { statusCode } = res;

        const message = `${method} ${originalUrl} ${statusCode} ${duration}ms`;

        // Write structured log entry via process.stdout directly
        // to include statusCode and duration fields
        const entry = {
          timestamp: new Date().toISOString(),
          level: statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info',
          message,
          context: 'HTTP',
          requestId: correlationId,
          workspaceId,
          userId: user?.id,
          method,
          url: originalUrl,
          statusCode,
          duration,
        };

        // Remove undefined values
        const cleanEntry = Object.fromEntries(
          Object.entries(entry).filter(([, v]) => v !== undefined),
        );

        const output = JSON.stringify(cleanEntry);
        if (statusCode >= 500) {
          process.stderr.write(output + '\n');
        } else {
          process.stdout.write(output + '\n');
        }
      });

      next();
    });
  }
}
