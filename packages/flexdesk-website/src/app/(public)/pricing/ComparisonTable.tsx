'use client';

import { Check, X } from 'lucide-react';

import { BillingToggle } from './BillingToggle';
import type { BillingPeriod, ComparisonCategory, PricingTier } from './types';

interface ComparisonTableProps {
  tiers: PricingTier[];
  categories: ComparisonCategory[];
  billingPeriod: BillingPeriod;
  onBillingPeriodChange: (period: BillingPeriod) => void;
}

function renderValue(value: boolean | string | number) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-4 h-4 text-emerald-500 mx-auto" strokeWidth={2.5} />
    ) : (
      <X className="w-4 h-4 text-gray-300 mx-auto" strokeWidth={2} />
    );
  }
  return <span className="text-sm text-gray-900">{value}</span>;
}

export function ComparisonTable({
  tiers,
  categories,
  billingPeriod,
  onBillingPeriodChange,
}: ComparisonTableProps) {
  return (
    <div className="mt-20">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 pb-4 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4 items-end">
          {/* Billing Toggle */}
          <div className="pr-4">
            <p className="text-sm text-gray-500 mb-2">Select preferred billing cycle</p>
            <BillingToggle value={billingPeriod} onChange={onBillingPeriodChange} />
          </div>

          {/* Tier Headers */}
          {tiers.map((tier) => (
            <div key={tier.id} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                {tier.highlighted && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded">
                    Popular
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {tier.priceLabel === 'Custom'
                  ? 'Get a custom quote, billed annually'
                  : billingPeriod === 'annual'
                    ? `$${tier.price.annual}/year, billed annually`
                    : `$${tier.price.monthly} per user/month, billed monthly`
                }
              </p>
              <a
                href={tier.ctaHref}
                className={[
                  'mt-3 inline-block w-full max-w-[180px] py-2 text-center text-sm font-medium rounded-lg',
                  'transition-all duration-200',
                  tier.highlighted
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50',
                ].join(' ')}
              >
                {tier.ctaText}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Categories */}
      {categories.map((category) => (
        <div key={category.name} className="mt-8">
          <h4 className="text-base font-semibold text-gray-900 pb-4">
            {category.name}
          </h4>
          <div className="border-t border-gray-200">
            {category.features.map((feature, index) => (
              <div
                key={feature.name}
                className={[
                  'grid grid-cols-3 gap-4 py-4',
                  index < category.features.length - 1 ? 'border-b border-gray-100' : '',
                ].join(' ')}
              >
                <div className="flex items-center gap-2 pr-4">
                  <span className="text-sm text-gray-600">{feature.name}</span>
                </div>
                {tiers.map((tier, tierIndex) => (
                  <div
                    key={tier.id}
                    className={[
                      'text-center py-2',
                      tier.highlighted ? 'bg-blue-50/50 -mx-2 px-2 rounded' : '',
                    ].join(' ')}
                  >
                    {renderValue(feature.values[tier.id as keyof typeof feature.values])}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
