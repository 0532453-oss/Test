import { type NestMiddleware } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { type NextFunction, type Request, type Response } from 'express';

/**
 * CSRF protection using the double-submit cookie pattern.
 *
 * How it works:
 * 1. This middleware sets a `csrf_token` non-httpOnly cookie on every response
 *    (so the frontend JS can read it).
 * 2. For state-changing requests (POST, PUT, PATCH, DELETE), the CsrfGuard
 *    (applied globally) checks that the `X-CSRF-Token` header matches the
 *    `csrf_token` cookie.
 * 3. A cross-origin attacker cannot read the cookie value (same-origin policy)
 *    and therefore cannot set the matching header.
 *
 * Exclusions:
 * - `@Public()` routes are excluded at the guard level (webhooks, health, auth).
 * - GET/HEAD/OPTIONS requests are excluded (read-only, no side effects).
 */
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // If the client already has a CSRF token cookie, keep it.
    // Otherwise, generate a new one.
    if (!req.cookies?.csrf_token) {
      const token = randomBytes(32).toString('hex');
      res.cookie('csrf_token', token, {
        httpOnly: false, // JS needs to read this
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
    }

    next();
  }
}
