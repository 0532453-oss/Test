'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

import { createCheckoutSession } from '@/lib/api';
import type { PricingCardProps, BillingPeriod } from './types';

interface PricingCardWithCheckoutProps extends PricingCardProps {
  onCheckoutError?: (error: string) => void;
}

export function PricingCard({ tier, billingPeriod, onCheckoutError }: PricingCardWithCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const price = billingPeriod === 'monthly'
    ? tier.price.monthly
    : tier.price.annual;

  const showSaveBadge = billingPeriod === 'annual' && tier.price.annual > 0 && tier.price.monthly > 0;
  const savingsPercent = showSaveBadge
    ? Math.round(((tier.price.monthly * 12 - tier.price.annual) / (tier.price.monthly * 12)) * 100)
    : 0;
  const isCustomPricing = tier.priceLabel === 'Custom';
  const isFreeTier = tier.id === 'free';
  const isProTier = tier.id === 'pro';
  const isEnterpriseTier = tier.id === 'enterprise';

  const handleCtaClick = async () => {
    // Free tier: redirect to signup
    if (isFreeTier) {
      window.location.href = '/signin?mode=signup&plan=free';
      return;
    }

    // Enterprise tier: redirect to contact
    if (isEnterpriseTier) {
      window.location.href = '/contact';
      return;
    }

    // Pro tier: go directly to Stripe checkout
    if (isProTier) {
      setIsLoading(true);
      setCheckoutError('');

      try {
        const interval = billingPeriod === 'monthly' ? 'month' : 'year';
        const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';

        const { url } = await createCheckoutSession({
          tierId: 'pro',
          interval,
          successUrl: `${currentUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${currentUrl}/pricing`,
        });

        // Redirect to Stripe Checkout
        window.location.href = url;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to start checkout';
        setCheckoutError(errorMessage);
        onCheckoutError?.(errorMessage);
        setIsLoading(false);
      }
    }
  };

  const getCtaText = () => {
    if (isProTier && isLoading) return 'Redirecting...';
    return tier.ctaText;
  };

  return (
    <article
      className={[
        'relative flex flex-col h-full p-6',
        'bg-white rounded-xl',
        'border',
        tier.highlighted ? 'border-gray-300' : 'border-gray-200',
        'transition-all duration-200',
      ].join(' ')}
    >
      {/* Header: Name + Badge */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">
          {tier.name}
        </h2>
        {tier.highlighted && (
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded">
            Popular
          </span>
        )}
      </div>

      {/* Price Section */}
      <div className="mt-4">
        {tier.trialDays && (
          <div className="mb-2">
            <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded">
              {tier.trialDays}-day free trial
            </span>
          </div>
        )}
        <div className="flex items-baseline gap-2">
          {isCustomPricing ? (
            <span className="text-4xl font-bold text-gray-900 tracking-tight">
              Custom
            </span>
          ) : (
            <>
              <span className="text-4xl font-bold text-gray-900 tracking-tight">
                ${price}
              </span>
              {showSaveBadge && (
                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded">
                  Save {savingsPercent}%
                </span>
              )}
            </>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {isCustomPricing
            ? 'Get a custom quote, billed annually'
            : billingPeriod === 'annual'
              ? `$${tier.price.annual}/year, billed annually`
              : `Per user/month, billed monthly`
          }
        </p>
      </div>

      {/* Tagline */}
      <p className="mt-6 text-sm font-medium text-gray-900">
        {tier.tagline}
      </p>

      {/* Features List */}
      <ul className="mt-4 space-y-3 flex-1">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" strokeWidth={2.5} />
            <span className="text-sm text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Checkout error message */}
      {checkoutError && (
        <p className="mt-4 text-xs text-red-600 text-center">{checkoutError}</p>
      )}

      {/* CTA Button */}
      <div className="mt-8">
        <button
          type="button"
          onClick={handleCtaClick}
          disabled={isLoading}
          className={[
            'block w-full py-2.5 text-center text-sm font-medium rounded-lg',
            'transition-all duration-200',
            isLoading ? 'cursor-not-allowed opacity-70' : '',
            tier.highlighted
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50',
          ].join(' ')}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {getCtaText()}
            </span>
          ) : (
            getCtaText()
          )}
        </button>
      </div>
    </article>
  );
}
