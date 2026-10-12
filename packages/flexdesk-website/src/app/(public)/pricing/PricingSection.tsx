'use client';

import { useState } from 'react';

import { BillingToggle } from './BillingToggle';
import { ComparisonTable } from './ComparisonTable';
import { PricingCard } from './PricingCard';
import type { BillingPeriod, ComparisonCategory, PricingTier } from './types';

const tiers: PricingTier[] = [
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For growing service teams',
    price: {
      monthly: 23,
      annual: 200,
    },
    trialDays: 7,
    features: [
      'Unlimited clients & jobs',
      'Insights & analytics',
      'Customer portal access',
    ],
    highlighted: true,
    ctaText: 'Start 7-day free trial',
    ctaHref: '/signup?plan=pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For large service organizations',
    price: {
      monthly: 0,
      annual: 0,
    },
    priceLabel: 'Custom',
    features: [
      'Custom reports & branding',
      'SAML SSO & audit logs',
      'Dedicated account manager',
    ],
    ctaText: 'Talk to sales',
    ctaHref: '/contact',
  },
];

const comparisonCategories: ComparisonCategory[] = [
  {
    name: 'Workspace',
    features: [
      {
        name: 'Team members',
        values: { pro: 'Unlimited', enterprise: 'Custom' },
      },
      {
        name: 'Active clients',
        values: { pro: 'Unlimited', enterprise: 'Unlimited' },
      },
      {
        name: 'Monthly jobs',
        values: { pro: 'Unlimited', enterprise: 'Unlimited' },
      },
      {
        name: 'Data export (CSV)',
        values: { pro: true, enterprise: true },
      },
      {
        name: 'Custom fields',
        values: { pro: true, enterprise: true },
      },
    ],
  },
  {
    name: 'Client & Job Management',
    features: [
      {
        name: 'Client management',
        values: { pro: true, enterprise: true },
      },
      {
        name: 'Job scheduling calendar',
        values: { pro: true, enterprise: true },
      },
      {
        name: 'Request tracking',
        values: { pro: true, enterprise: true },
      },
      {
        name: 'Request to job conversion',
        values: { pro: true, enterprise: true },
      },
      {
        name: 'Recurring jobs',
        values: { pro: true, enterprise: true },
      },
      {
        name: 'Job priority levels',
        values: { pro: 'Advanced', enterprise: 'Advanced' },
      },
    ],
  },
  {
    name: 'Invoicing & Payments',
    features: [
      {
        name: 'Invoice creation',
        values: { pro: true, enterprise: true },
      },
      {
        name: 'Monthly invoices',
        values: { pro: 'Unlimited', enterprise: 'Unlimited' },
      },
      {
        name: 'Payment reminders',
        values: { pro: true, enterprise: true },
      },
      {
        name: 'Invoice templates',
        values: { pro: true, enterprise: true },
      },
      {
        name: 'Multi-currency support',
        values: { pro: false, enterprise: true },
      },
    ],
  },
  {
    name: 'Insights & Analytics',
    features: [
      {
        name: 'Dashboard overview',
        values: { pro: true, enterprise: true },
      },
      {
        name: 'Revenue tracking',
        values: { pro: true, enterprise: true },
      },
      {
        name: 'Job completion analytics',
        values: { pro: true, enterprise: true },
      },
      {
        name: 'Custom reports',
        values: { pro: false, enterprise: true },
      },
    ],
  },
  {
    name: 'Customer Portal',
    features: [
      {
        name: 'Client job history view',
        values: { pro: true, enterprise: true },
      },
      {
        name: 'Client invoice access',
        values: { pro: true, enterprise: true },
      },
      {
        name: 'Branded portal',
        values: { pro: false, enterprise: true },
      },
    ],
  },
  {
    name: 'Security & Support',
    features: [
      {
        name: 'Email support',
        values: { pro: true, enterprise: true },
      },
      {
        name: 'Priority support',
        values: { pro: true, enterprise: true },
      },
      {
        name: 'SAML SSO',
        values: { pro: false, enterprise: true },
      },
      {
        name: 'Audit logs',
        values: { pro: false, enterprise: true },
      },
      {
        name: 'Dedicated account manager',
        values: { pro: false, enterprise: true },
      },
    ],
  },
];

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual');

  return (
    <div className="w-full">
      {/* Billing Toggle */}
      <div className="flex justify-center mb-12">
        <BillingToggle
          value={billingPeriod}
          onChange={setBillingPeriod}
        />
      </div>

      {/* Pricing Cards Grid */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 items-stretch max-w-5xl mx-auto">
        {tiers.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            billingPeriod={billingPeriod}
          />
        ))}
      </section>

      {/* Feature Comparison Table */}
      <ComparisonTable
        tiers={tiers}
        categories={comparisonCategories}
        billingPeriod={billingPeriod}
        onBillingPeriodChange={setBillingPeriod}
      />
    </div>
  );
}
