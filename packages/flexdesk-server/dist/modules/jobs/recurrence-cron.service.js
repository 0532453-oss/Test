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
var RecurrenceCronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurrenceCronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const workspace_context_1 = require("../../core/database/workspace-context");
let RecurrenceCronService = RecurrenceCronService_1 = class RecurrenceCronService {
    constructor(prisma, recurrenceService, configService) {
        this.prisma = prisma;
        this.recurrenceService = recurrenceService;
        this.configService = configService;
        this.logger = new common_1.Logger(RecurrenceCronService_1.name);
        this.isEnabled = true;
    }
    onModuleInit() {
        const cronEnabled = this.configService.get('RECURRENCE_CRON_ENABLED');
        this.isEnabled = cronEnabled !== 'false';
        if (this.isEnabled) {
            this.logger.log('Recurrence cron job initialized and enabled');
        }
        else {
            this.logger.log('Recurrence cron job is disabled via RECURRENCE_CRON_ENABLED=false');
        }
    }
    async handleRecurringJobGeneration() {
        if (!this.isEnabled) {
            return;
        }
        this.logger.log('Starting daily recurring job generation...');
        try {
            const results = await this.processAllWorkspaces();
            this.logger.log(`Recurring job generation complete: ${results.totalGenerated} generated, ` +
                `${results.totalSkipped} skipped, ${results.totalErrors} errors across ` +
                `${results.workspacesProcessed} workspaces`);
            if (results.errors.length > 0) {
                for (const error of results.errors) {
                    this.logger.error(`Error generating job for template ${error.templateId} in workspace ${error.workspaceId}: ${error.error}`);
                }
            }
        }
        catch (error) {
            this.logger.error(`Fatal error in recurring job generation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async processAllWorkspaces() {
        const workspaces = await this.prisma.workspace.findMany({
            where: {
                recurringJobTemplates: {
                    some: {
                        isActive: true,
                    },
                },
            },
            select: {
                id: true,
            },
        });
        let totalGenerated = 0;
        let totalSkipped = 0;
        let totalErrors = 0;
        const errors = [];
        for (const workspace of workspaces) {
            try {
                const result = await (0, workspace_context_1.runWithWorkspace)(workspace.id, async () => {
                    return await this.recurrenceService.generateRecurringJobs(workspace.id);
                });
                totalGenerated += result.generated;
                totalSkipped += result.skipped;
                totalErrors += result.errors.length;
                for (const err of result.errors) {
                    errors.push({
                        workspaceId: workspace.id,
                        templateId: err.templateId,
                        error: err.error,
                    });
                }
            }
            catch (error) {
                this.logger.error(`Error processing workspace ${workspace.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                totalErrors++;
                errors.push({
                    workspaceId: workspace.id,
                    templateId: 'N/A',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        return {
            workspacesProcessed: workspaces.length,
            totalGenerated,
            totalSkipped,
            totalErrors,
            errors,
        };
    }
    async triggerManualRun() {
        this.logger.log('Manual recurring job generation triggered');
        return await this.processAllWorkspaces();
    }
    isCronEnabled() {
        return this.isEnabled;
    }
    setCronEnabled(enabled) {
        this.isEnabled = enabled;
        this.logger.log(`Recurrence cron job ${enabled ? 'enabled' : 'disabled'}`);
    }
};
exports.RecurrenceCronService = RecurrenceCronService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_1AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RecurrenceCronService.prototype, "handleRecurringJobGeneration", null);
exports.RecurrenceCronService = RecurrenceCronService = RecurrenceCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function, Function, Function])
], RecurrenceCronService);
