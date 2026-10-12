// Pricing TypeScript Interfaces

export type BillingPeriod = 'monthly' | 'annual';

export interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  price: {
    monthly: number;
    annual: number;
  };
  priceLabel?: string; // For "Custom" pricing
  trialDays?: number; // Number of days for free trial
  features: string[];
  highlighted?: boolean;
  ctaText: string;
  ctaHref: string;
}

export interface BillingToggleProps {
  value: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}

export interface PricingCardProps {
  tier: PricingTier;
  billingPeriod: BillingPeriod;
}

// Feature comparison table types
export type FeatureValue = boolean | string | number;

export interface ComparisonFeature {
  name: string;
  tooltip?: string;
  values: {
    [key: string]: FeatureValue;
  };
}

export interface ComparisonCategory {
  name: string;
  features: ComparisonFeature[];
}
