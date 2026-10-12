import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import { type Observable } from 'rxjs';

import { runWithWorkspace } from '@/core/database/workspace-context';
import { IS_PUBLIC_KEY } from '@/modules/auth/decorators/public.decorator';

@Injectable()
export class WorkspaceInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();

    const user = request.user;
    const workspaceId: string | null = user?.workspaceId ?? null;

    if (!workspaceId) {
      throw new UnauthorizedException('Workspace not found in authentication token');
    }

    return runWithWorkspace(workspaceId, () => next.handle());
  }
}

