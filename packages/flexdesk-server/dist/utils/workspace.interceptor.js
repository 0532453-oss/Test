"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceInterceptor = void 0;
const common_1 = require("@nestjs/common");
const workspace_context_1 = require("../core/database/workspace-context");
const public_decorator_1 = require("../modules/auth/decorators/public.decorator");
let WorkspaceInterceptor = class WorkspaceInterceptor {
    constructor(reflector) {
        this.reflector = reflector;
    }
    intercept(context, next) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return next.handle();
        }
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest();
        const user = request.user;
        const workspaceId = user?.workspaceId ?? null;
        if (!workspaceId) {
            throw new common_1.UnauthorizedException('Workspace not found in authentication token');
        }
        return (0, workspace_context_1.runWithWorkspace)(workspaceId, () => next.handle());
    }
};
exports.WorkspaceInterceptor = WorkspaceInterceptor;
exports.WorkspaceInterceptor = WorkspaceInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], WorkspaceInterceptor);
