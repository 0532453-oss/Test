import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Request } from 'express';
import { timingSafeEqual } from 'crypto';

import { IS_PUBLIC_KEY } from '@/modules/auth/decorators/public.decorator';

/**
 * Guard that validates the double-submit CSRF token on state-changing requests.
 *
 * Checks that `X-CSRF-Token` header matches the `csrf_token` cookie.
 * Skipped for:
 * - Safe HTTP methods (GET, HEAD, OPTIONS)
 * - Routes decorated with `@Public()` (auth, webhooks, health checks)
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();

    // Safe methods don't need CSRF protection
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    // Skip CSRF for @Public() routes (webhooks, auth endpoints, health checks)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const cookieToken = request.cookies?.csrf_token;
    const headerToken = request.headers['x-csrf-token'] as string | undefined;

    if (!cookieToken || !headerToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    // Timing-safe comparison to prevent timing attacks
    if (!this.tokensMatch(cookieToken, headerToken)) {
      throw new ForbiddenException('CSRF token mismatch');
    }

    return true;
  }

  private tokensMatch(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}
