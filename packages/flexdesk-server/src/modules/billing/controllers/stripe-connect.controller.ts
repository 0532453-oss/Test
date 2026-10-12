import {
  Controller,
  Post,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

import { StripeConnectService, type OnboardingLinkResult, type StripeAccountStatus } from '../stripe-manager/stripe-connect.service';

@ApiTags('stripe-connect')
@Controller('stripe')
export class StripeConnectController {
  constructor(private readonly stripeConnectService: StripeConnectService) {}

  @Post('onboard/:technicianId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Stripe Express account and onboarding link for a service provider',
    description:
      'Creates a Stripe Express account (if not already created) for the specified technician and generates an account link URL for the Stripe-hosted onboarding UI.',
  })
  @ApiParam({
    name: 'technicianId',
    description: 'The ID of the technician/service provider to onboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding link created successfully',
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', example: 'acct_1234567890' },
        onboardingUrl: { type: 'string', example: 'https://connect.stripe.com/setup/...' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Stripe not configured or invalid request' })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  async createOnboardingLink(
    @Param('technicianId', ParseUUIDPipe) technicianId: string,
  ): Promise<OnboardingLinkResult> {
    return this.stripeConnectService.createOnboardingLink(technicianId);
  }

  @Get('account/:technicianId/status')
  @ApiOperation({
    summary: 'Get Stripe account status for a service provider',
    description:
      'Retrieves the current Stripe account status including whether charges are enabled and onboarding is complete.',
  })
  @ApiParam({
    name: 'technicianId',
    description: 'The ID of the technician/service provider',
  })
  @ApiResponse({
    status: 200,
    description: 'Account status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', example: 'acct_1234567890' },
        chargesEnabled: { type: 'boolean', example: true },
        payoutsEnabled: { type: 'boolean', example: true },
        detailsSubmitted: { type: 'boolean', example: true },
        onboardingComplete: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Technician has not started onboarding' })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  async getAccountStatus(
    @Param('technicianId', ParseUUIDPipe) technicianId: string,
  ): Promise<StripeAccountStatus> {
    return this.stripeConnectService.getAccountStatus(technicianId);
  }
}
