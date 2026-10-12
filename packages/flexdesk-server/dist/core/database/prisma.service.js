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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const workspace_middleware_1 = require("./workspace-middleware");
const extendedPrismaClient = new client_1.PrismaClient().$extends(workspace_middleware_1.workspaceExtension);
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    get extended() {
        if (!this._extended) {
            this._extended = this.$extends(workspace_middleware_1.workspaceExtension);
        }
        return this._extended;
    }
    constructor() {
        super();
        this._extended = null;
        return new Proxy(this, {
            get(target, prop, receiver) {
                if (typeof prop === 'string' &&
                    PrismaService_1.PRISMA_MODEL_PROPERTIES.has(prop)) {
                    return target.extended[prop];
                }
                return Reflect.get(target, prop, receiver);
            },
        });
    }
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
exports.PrismaService = PrismaService;
PrismaService.PRISMA_MODEL_PROPERTIES = new Set([
    'job',
    'technician',
    'customer',
    'invoice',
    'estimate',
    'property',
    'part',
    'jobPart',
    'recurringJobTemplate',
    'role',
    'workspaceMember',
    'workspace',
    'user',
    'notificationPreference',
    'invoiceLineItem',
    'jobNote',
    'jobAttachment',
    'estimateLineItem',
    'permission',
    'rolePermission',
    'gitHubStars',
]);
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
