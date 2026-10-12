"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueWorkerModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const invoice_generation_processor_1 = require("./processors/invoice-generation.processor");
const job_notification_processor_1 = require("./processors/job-notification.processor");
const report_generation_processor_1 = require("./processors/report-generation.processor");
let QueueWorkerModule = class QueueWorkerModule {
};
exports.QueueWorkerModule = QueueWorkerModule;
exports.QueueWorkerModule = QueueWorkerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
        ],
        providers: [
            job_notification_processor_1.JobNotificationProcessor,
            invoice_generation_processor_1.InvoiceGenerationProcessor,
            report_generation_processor_1.ReportGenerationProcessor,
        ],
        exports: [
            job_notification_processor_1.JobNotificationProcessor,
            invoice_generation_processor_1.InvoiceGenerationProcessor,
            report_generation_processor_1.ReportGenerationProcessor,
        ],
    })
], QueueWorkerModule);
