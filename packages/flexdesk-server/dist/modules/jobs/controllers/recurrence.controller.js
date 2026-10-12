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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurrenceController = void 0;
const common_1 = require("@nestjs/common");
let RecurrenceController = class RecurrenceController {
    constructor(recurrenceService) {
        this.recurrenceService = recurrenceService;
    }
    async createTemplate(createTemplateDto) {
        return await this.recurrenceService.createTemplate(createTemplateDto);
    }
    async processAllRecurringJobs() {
        return await this.recurrenceService.generateRecurringJobs();
    }
    async generateJob(id, body) {
        const targetDate = body?.targetDate
            ? new Date(body.targetDate)
            : new Date();
        return await this.recurrenceService.generateJobFromTemplate(id, targetDate);
    }
};
exports.RecurrenceController = RecurrenceController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], RecurrenceController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Post)('process-all'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RecurrenceController.prototype, "processAllRecurringJobs", null);
__decorate([
    (0, common_1.Post)(':id/generate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RecurrenceController.prototype, "generateJob", null);
exports.RecurrenceController = RecurrenceController = __decorate([
    (0, common_1.Controller)('recurring-templates'),
    __metadata("design:paramtypes", [Function])
], RecurrenceController);
