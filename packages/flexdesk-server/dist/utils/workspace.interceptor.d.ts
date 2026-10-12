import { type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import { type Observable } from 'rxjs';
export declare class WorkspaceInterceptor implements NestInterceptor {
    private reflector;
    constructor(reflector: Reflector);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
