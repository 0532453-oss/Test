import { type Request } from 'express';
import { type CustomerPortalService, type CustomerPortalData, type InvoiceSummary, type JobSummary, type PortalTokenResult } from './customer-portal.service';
import { type GeneratePortalTokenDto } from './dto/generate-portal-token.dto';
import { type PaymentLinkResult } from '@/modules/billing/stripe-manager/stripe.service';
export declare class CustomerPortalController {
    private readonly portalService;
    constructor(portalService: CustomerPortalService);
    generateToken(dto: GeneratePortalTokenDto): Promise<PortalTokenResult>;
    getPortalData(req: Request, queryToken: string): Promise<CustomerPortalData>;
    getInvoices(req: Request, queryToken: string): Promise<InvoiceSummary[]>;
    getInvoiceById(id: string, req: Request, queryToken: string): Promise<InvoiceSummary>;
    getJobs(req: Request, queryToken: string): Promise<JobSummary[]>;
    getJobById(id: string, req: Request, queryToken: string): Promise<JobSummary>;
    getPaymentLink(id: string, req: Request, queryToken: string): Promise<PaymentLinkResult>;
    private extractToken;
}
