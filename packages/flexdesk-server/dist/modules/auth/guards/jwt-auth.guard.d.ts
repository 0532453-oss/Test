import { type ExecutionContext } from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import { type Observable } from 'rxjs';
declare const JwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtAuthGuard extends JwtAuthGuard_base {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>;
    handleRequest<TUser>(err: Error | null, user: TUser | false, info: Error | undefined): TUser;
}
export {};
