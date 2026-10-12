import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { SentryModule } from './core/sentry/sentry.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Core Module
import { CoreModule } from './core';
import { CsrfGuard } from './core/guards/csrf.guard';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';

// Jobs Module (with Manager pattern)

// Billing Module (with Manager pattern)
import { BillingModule } from './modules/billing';

// Queue Worker Module

// Technicians

// Customers

// Notifications

// Workspaces
import { WorkspaceService } from './modules/workspaces/workspace.service';

// Customer Portal
import { CustomerPortalController } from './modules/customer-portal/customer-portal.controller';
import { CustomerPortalService } from './modules/customer-portal/customer-portal.service';
import { CustomerController } from './modules/customers/customer.controller';
import { CustomerService } from './modules/customers/customer.service';

// Estimates
import { EstimateController } from './modules/estimates/estimate.controller';
import { EstimateService } from './modules/estimates/estimate.service';

// Properties

// Routing
import { RouteOptimizationController } from './modules/routing/route-optimization.controller';
import { RouteOptimizationService } from './modules/routing/route-optimization.service';

// Maps
import { MapsModule } from './modules/maps/maps.module';

// Parts & Inventory
import { PartController, JobPartController } from './modules/parts/part.controller';
import { PartService } from './modules/parts/part.service';

// Reports & Analytics
import { ReportController } from './modules/reports/report.controller';
import { ReportService } from './modules/reports/report.service';

// Health Check
import { HealthModule } from './modules/health';
import { JobsModule } from './modules/jobs';
import { NotificationModule } from './modules/notifications/notification.module';
import { PropertyController } from './modules/properties/property.controller';
import { PropertyService } from './modules/properties/property.service';

// Roles & Permissions
import { RoleController, PermissionController } from './modules/roles/role.controller';
import { RoleService } from './modules/roles/role.service';
import { PublicTrackingController } from './modules/technician/controllers/public-tracking.controller';
import { TechnicianController } from './modules/technician/controllers/technician.controller';
import { TechnicianService } from './modules/technician/technician.service';
import { WorkspaceController } from './modules/workspaces/workspace.controller';
import { QueueWorkerModule } from './queue-worker';
import { WorkspaceInterceptor } from './utils/workspace.interceptor';

/**
 * FlexDesk Server - Main Application Module
 *
 * Architecture:
 * - CoreModule: Database, Config, Guards, Filters, Interceptors
 * - Feature Modules: Auth, Jobs, Billing, etc.
 * - QueueWorkerModule: Async task processing
 *
 * Module Organization follows Twenty CRM patterns:
 * - Domain-driven design with feature modules
 * - Manager pattern for complex business logic
 * - Hierarchical sub-modules within feature modules
 */
@Module({
  imports: [
    // Rate limiting — 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // Sentry error tracking (no-op if SENTRY_DSN is not set)
    SentryModule,

    // Core infrastructure
    CoreModule,

    // Feature modules (with Manager pattern)
    AuthModule,
    JobsModule,
    BillingModule,

    // Standard feature modules
    MapsModule,
    HealthModule,
    NotificationModule,

    // Background processing
    QueueWorkerModule,
  ],
  controllers: [
    // Technicians
    TechnicianController,
    PublicTrackingController,
    // Customers
    CustomerController,
    // Customer Portal
    CustomerPortalController,
    // Workspaces
    WorkspaceController,
    // Estimates
    EstimateController,
    // Properties
    PropertyController,
    // Routing
    RouteOptimizationController,
    // Parts & Inventory
    PartController,
    JobPartController,
    // Reports & Analytics
    ReportController,
    // Roles & Permissions
    RoleController,
    PermissionController,
  ],
  providers: [
    // Services (to be migrated to feature modules)
    TechnicianService,
    CustomerService,
    WorkspaceService,
    CustomerPortalService,
    EstimateService,
    PropertyService,
    RouteOptimizationService,
    PartService,
    ReportService,
    RoleService,
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: WorkspaceInterceptor,
    },
  ],
})
export class AppModule {}
