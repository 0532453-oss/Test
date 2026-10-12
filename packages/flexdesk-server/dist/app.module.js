"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const setup_1 = require("@sentry/nestjs/setup");
const throttler_1 = require("@nestjs/throttler");
const core_2 = require("./core");
const csrf_guard_1 = require("./core/guards/csrf.guard");
const auth_module_1 = require("./modules/auth/auth.module");
const jwt_auth_guard_1 = require("./modules/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("./modules/auth/guards/roles.guard");
const billing_1 = require("./modules/billing");
const workspace_service_1 = require("./modules/workspaces/workspace.service");
const customer_portal_controller_1 = require("./modules/customer-portal/customer-portal.controller");
const customer_portal_service_1 = require("./modules/customer-portal/customer-portal.service");
const customer_controller_1 = require("./modules/customers/customer.controller");
const customer_service_1 = require("./modules/customers/customer.service");
const estimate_controller_1 = require("./modules/estimates/estimate.controller");
const estimate_service_1 = require("./modules/estimates/estimate.service");
const route_optimization_controller_1 = require("./modules/routing/route-optimization.controller");
const route_optimization_service_1 = require("./modules/routing/route-optimization.service");
const maps_module_1 = require("./modules/maps/maps.module");
const part_controller_1 = require("./modules/parts/part.controller");
const part_service_1 = require("./modules/parts/part.service");
const report_controller_1 = require("./modules/reports/report.controller");
const report_service_1 = require("./modules/reports/report.service");
const health_1 = require("./modules/health");
const jobs_1 = require("./modules/jobs");
const notification_module_1 = require("./modules/notifications/notification.module");
const property_controller_1 = require("./modules/properties/property.controller");
const property_service_1 = require("./modules/properties/property.service");
const role_controller_1 = require("./modules/roles/role.controller");
const role_service_1 = require("./modules/roles/role.service");
const public_tracking_controller_1 = require("./modules/technician/controllers/public-tracking.controller");
const technician_controller_1 = require("./modules/technician/controllers/technician.controller");
const technician_service_1 = require("./modules/technician/technician.service");
const workspace_controller_1 = require("./modules/workspaces/workspace.controller");
const queue_worker_1 = require("./queue-worker");
const workspace_interceptor_1 = require("./utils/workspace.interceptor");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 100,
                }]),
            setup_1.SentryModule.forRoot(),
            core_2.CoreModule,
            auth_module_1.AuthModule,
            jobs_1.JobsModule,
            billing_1.BillingModule,
            maps_module_1.MapsModule,
            health_1.HealthModule,
            notification_module_1.NotificationModule,
            queue_worker_1.QueueWorkerModule,
        ],
        controllers: [
            technician_controller_1.TechnicianController,
            public_tracking_controller_1.PublicTrackingController,
            customer_controller_1.CustomerController,
            customer_portal_controller_1.CustomerPortalController,
            workspace_controller_1.WorkspaceController,
            estimate_controller_1.EstimateController,
            property_controller_1.PropertyController,
            route_optimization_controller_1.RouteOptimizationController,
            part_controller_1.PartController,
            part_controller_1.JobPartController,
            report_controller_1.ReportController,
            role_controller_1.RoleController,
            role_controller_1.PermissionController,
        ],
        providers: [
            technician_service_1.TechnicianService,
            customer_service_1.CustomerService,
            workspace_service_1.WorkspaceService,
            customer_portal_service_1.CustomerPortalService,
            estimate_service_1.EstimateService,
            property_service_1.PropertyService,
            route_optimization_service_1.RouteOptimizationService,
            part_service_1.PartService,
            report_service_1.ReportService,
            role_service_1.RoleService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: csrf_guard_1.CsrfGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: workspace_interceptor_1.WorkspaceInterceptor,
            },
        ],
    })
], AppModule);
