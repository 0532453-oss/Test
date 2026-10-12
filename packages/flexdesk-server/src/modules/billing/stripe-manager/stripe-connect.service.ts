import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { PrismaService } from '@/core/database/prisma.service';
import { getWorkspaceId } from '@/core/database/workspace-context';

export interface OnboardingLinkResult {
  accountId: string;
  onboardingUrl: string;
}

export interface StripeAccountStatus {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  onboardingComplete: boolean;
}

@Injectable()
export class StripeConnectService {
  private readonly stripe: Stripe | null;
  private readonly logger = new Logger(StripeConnectService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (secretKey) {
      this.stripe = new Stripe(secretKey);
    } else {
      this.stripe = null;
      this.logger.warn('Stripe secret key not configured. Stripe Connect features will be disabled.');
    }
  }

  private getWorkspaceIdOrThrow(): string {
    const workspaceId = getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Workspace context is required');
    }
    return workspaceId;
  }

  private ensureStripeConfigured(): Stripe {
    if (!this.stripe) {
      throw new ServiceUnavailableException('Billing not configured');
    }
    return this.stripe;
  }

  /**
   * Create a Stripe Express account for a technician and generate an onboarding link.
   * This implements the /stripe/onboard endpoint functionality.
   */
  async createOnboardingLink(technicianId: string): Promise<OnboardingLinkResult> {
    const stripe = this.ensureStripeConfigured();
    const workspaceId = this.getWorkspaceIdOrThrow();

    // Find the technician
    const technician = await this.prisma.technician.findFirst({
      where: { id: technicianId, workspaceId },
      include: { user: true },
    });

    if (!technician) {
      throw new NotFoundException('Technician not found');
    }

    let stripeAccountId = technician.stripeAccountId;

    // If technician doesn't have a Stripe account yet, create one
    if (!stripeAccountId) {
      this.logger.log(`Creating Stripe Express account for technician ${technicianId}`);

      const account = await stripe.accounts.create({
        type: 'express',
        email: technician.user.email,
        metadata: {
          technicianId: technician.id,
          workspaceId: workspaceId,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      stripeAccountId = account.id;

      // Update technician with Stripe account ID
      await this.prisma.technician.update({
        where: { id: technicianId },
        data: {
          stripeAccountId: account.id,
          stripeChargesEnabled: account.charges_enabled,
          stripeOnboardingComplete: account.details_submitted,
        },
      });

      this.logger.log(`Created Stripe Express account ${account.id} for technician ${technicianId}`);
    }

    // Generate the account link for onboarding
    const publicAppUrl = this.configService.get<string>('app.publicAppUrl') || 'http://localhost:3000';

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${publicAppUrl}/provider/onboarding/refresh?technicianId=${technicianId}`,
      return_url: `${publicAppUrl}/provider/onboarding/complete?technicianId=${technicianId}`,
      type: 'account_onboarding',
    });

    this.logger.log(`Generated onboarding link for technician ${technicianId}`);

    return {
      accountId: stripeAccountId,
      onboardingUrl: accountLink.url,
    };
  }

  /**
   * Get the current Stripe account status for a technician.
   */
  async getAccountStatus(technicianId: string): Promise<StripeAccountStatus> {
    const stripe = this.ensureStripeConfigured();
    const workspaceId = this.getWorkspaceIdOrThrow();

    const technician = await this.prisma.technician.findFirst({
      where: { id: technicianId, workspaceId },
    });

    if (!technician) {
      throw new NotFoundException('Technician not found');
    }

    if (!technician.stripeAccountId) {
      throw new BadRequestException('Technician has not started Stripe onboarding');
    }

    // Retrieve the account from Stripe to get current status
    const account = await stripe.accounts.retrieve(technician.stripeAccountId);

    // Update local database with latest status
    await this.prisma.technician.update({
      where: { id: technicianId },
      data: {
        stripeChargesEnabled: account.charges_enabled,
        stripeOnboardingComplete: account.details_submitted,
      },
    });

    return {
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
      onboardingComplete: account.details_submitted && account.charges_enabled,
    };
  }

  /**
   * Handle account.updated webhook events from Stripe.
   * Updates the technician's Stripe status in the database.
   */
  async handleAccountUpdated(account: Stripe.Account): Promise<void> {
    const technicianId = account.metadata?.technicianId;

    if (!technicianId) {
      this.logger.warn(`Received account.updated for account ${account.id} without technicianId metadata`);
      return;
    }

    const technician = await this.prisma.technician.findFirst({
      where: { stripeAccountId: account.id },
    });

    if (!technician) {
      this.logger.warn(`Technician not found for Stripe account ${account.id}`);
      return;
    }

    await this.prisma.technician.update({
      where: { id: technician.id },
      data: {
        stripeChargesEnabled: account.charges_enabled,
        stripeOnboardingComplete: account.details_submitted,
      },
    });

    this.logger.log(
      `Updated technician ${technician.id} Stripe status: charges_enabled=${account.charges_enabled}, details_submitted=${account.details_submitted}`,
    );
  }
}
