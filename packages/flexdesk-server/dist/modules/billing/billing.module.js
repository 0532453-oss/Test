"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingModule = void 0;
const common_1 = require("@nestjs/common");
const invoice_controller_1 = require("./controllers/invoice.controller");
const stripe_connect_controller_1 = require("./controllers/stripe-connect.controller");
const stripe_subscription_controller_1 = require("./controllers/stripe-subscription.controller");
const stripe_webhook_controller_1 = require("./controllers/stripe-webhook.controller");
const invoice_manager_1 = require("./invoice-manager");
const stripe_manager_1 = require("./stripe-manager");
let BillingModule = class BillingModule {
};
exports.BillingModule = BillingModule;
exports.BillingModule = BillingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            stripe_manager_1.StripeManagerModule,
            invoice_manager_1.InvoiceManagerModule,
        ],
        controllers: [
            invoice_controller_1.InvoiceController,
            stripe_connect_controller_1.StripeConnectController,
            stripe_subscription_controller_1.StripeSubscriptionController,
            stripe_webhook_controller_1.StripeWebhookController,
        ],
        exports: [
            stripe_manager_1.StripeManagerModule,
            invoice_manager_1.InvoiceManagerModule,
        ],
    })
], BillingModule);
