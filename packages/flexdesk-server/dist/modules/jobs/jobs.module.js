"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsModule = void 0;
const common_1 = require("@nestjs/common");
const invoice_manager_1 = require("../billing/invoice-manager");
const job_controller_1 = require("./controllers/job.controller");
const recurrence_controller_1 = require("./controllers/recurrence.controller");
const job_completion_manager_1 = require("./job-completion-manager");
const job_dispatch_manager_1 = require("./job-dispatch-manager");
const job_scheduling_manager_1 = require("./job-scheduling-manager");
const job_service_1 = require("./job.service");
const recurrence_cron_service_1 = require("./recurrence-cron.service");
const recurrence_service_1 = require("./recurrence.service");
let JobsModule = class JobsModule {
};
exports.JobsModule = JobsModule;
exports.JobsModule = JobsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            job_scheduling_manager_1.JobSchedulingManagerModule,
            job_dispatch_manager_1.JobDispatchManagerModule,
            job_completion_manager_1.JobCompletionManagerModule,
            invoice_manager_1.InvoiceManagerModule,
        ],
        controllers: [
            job_controller_1.JobController,
            recurrence_controller_1.RecurrenceController,
        ],
        providers: [
            job_service_1.JobService,
            recurrence_service_1.RecurrenceService,
            recurrence_cron_service_1.RecurrenceCronService,
        ],
        exports: [
            job_service_1.JobService,
            job_scheduling_manager_1.JobSchedulingManagerModule,
            job_dispatch_manager_1.JobDispatchManagerModule,
            job_completion_manager_1.JobCompletionManagerModule,
        ],
    })
], JobsModule);
