'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight } from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function CheckoutSuccessSection() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) {
      // Redirect to main app signup with session ID
      const signupUrl = new URL('/signin', APP_URL);
      signupUrl.searchParams.set('mode', 'signup');
      signupUrl.searchParams.set('plan', 'pro');
      if (sessionId) {
        signupUrl.searchParams.set('checkout_session', sessionId);
      }
      window.location.href = signupUrl.toString();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, sessionId]);

  const handleContinue = () => {
    const signupUrl = new URL('/signin', APP_URL);
    signupUrl.searchParams.set('mode', 'signup');
    signupUrl.searchParams.set('plan', 'pro');
    if (sessionId) {
      signupUrl.searchParams.set('checkout_session', sessionId);
    }
    window.location.href = signupUrl.toString();
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>

        {/* Heading */}
        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          Payment Successful!
        </h1>

        {/* Message */}
        <p className="mt-3 text-gray-600">
          Thank you for subscribing to FlexDesk Pro. Your subscription is now active.
        </p>

        {/* Auto-redirect notice */}
        <p className="mt-4 text-sm text-gray-500">
          Redirecting to account setup in {countdown} seconds...
        </p>

        {/* Manual continue button */}
        <button
          onClick={handleContinue}
          className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          Continue to Setup
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Session ID (for debugging) */}
        {sessionId && (
          <p className="mt-8 text-xs text-gray-400 break-all">
            Session: {sessionId}
          </p>
        )}
      </div>
    </section>
  );
}
