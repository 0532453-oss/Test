import type { Metadata } from 'next';

import { ContentContainer } from '../../_components/ui/layout/ContentContainer';

import { PricingSection } from './PricingSection';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pricing - Service Flex',
  description: 'Simple, transparent pricing. Choose the plan that fits your stage.',
};

// Server Component - Main Layout
export default function PricingPage() {
  return (
    <ContentContainer>
      <main className="w-full max-w-6xl mx-auto pt-10 pb-20">
        <PricingSection />
      </main>
    </ContentContainer>
  );
}

