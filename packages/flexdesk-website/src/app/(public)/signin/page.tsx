import type { Metadata } from 'next';

import { ContentContainer } from '../../_components/ui/layout/ContentContainer';

import { SignInSection } from './SignInSection';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign In - FlexDesk',
  description: 'Sign in to your FlexDesk account or create a new one.',
};

export default function SignInPage() {
  return (
    <ContentContainer>
      <main className="w-full max-w-5xl mx-auto pt-10 pb-20">
        <SignInSection />
      </main>
    </ContentContainer>
  );
}
