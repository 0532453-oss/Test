import { Suspense } from 'react';
import { CheckoutSuccessSection } from './CheckoutSuccessSection';

export const metadata = {
  title: 'Checkout Successful | FlexDesk',
  description: 'Thank you for your purchase. Complete your account setup.',
};

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessLoading />}>
      <CheckoutSuccessSection />
    </Suspense>
  );
}

function CheckoutSuccessLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
