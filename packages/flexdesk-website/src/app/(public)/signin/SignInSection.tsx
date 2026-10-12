'use client';

import { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';

type AuthMode = 'signin' | 'signup';

interface PlanTier {
  id: string;
  name: string;
  tagline: string;
  price: number;
  priceLabel?: string;
  features: string[];
  highlighted?: boolean;
}

const plans: PlanTier[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'For solo contractors getting started',
    price: 0,
    features: [
      'Up to 50 active clients',
      'Job scheduling calendar',
      'Basic invoicing',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For growing service teams',
    price: 23,
    features: [
      'Unlimited clients & jobs',
      'Insights & analytics',
      'Customer portal access',
    ],
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For large service organizations',
    price: 0,
    priceLabel: 'Custom',
    features: [
      'Custom reports & branding',
      'SAML SSO & audit logs',
      'Dedicated account manager',
    ],
  },
];

export function SignInSection() {
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173';
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api\/v1\/?$/, '');

    if (authMode === 'signup') {
      setIsSubmitting(true);
      setError(null);
      try {
        const res = await fetch(`${apiUrl}/api/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name, email, password, plan: selectedPlan }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Registration failed. Please try again.');
        }
        localStorage.setItem('accessToken', data.accessToken);
        window.location.href = `${appUrl}/dashboard`;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Redirect to sign in
      window.location.href = `${appUrl}/login?email=${encodeURIComponent(email)}`;
    }
  };

  return (
    <div className="w-full">
      {/* Header Section */}
      <section className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
          {authMode === 'signup' ? 'Get started with FlexDesk' : 'Welcome back'}
        </h1>
        <p className="mt-3 text-base text-gray-600">
          {authMode === 'signup'
            ? 'Choose a plan and create your account'
            : 'Sign in to access your dashboard'}
        </p>
      </section>

      {/* Auth Mode Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          <button
            onClick={() => setAuthMode('signup')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              authMode === 'signup'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Create Account
          </button>
          <button
            onClick={() => setAuthMode('signin')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              authMode === 'signin'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
        </div>
      </div>

      {authMode === 'signup' ? (
        <>
          {/* Plan Selection Cards */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-10 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative flex flex-col p-5 text-left rounded-xl border-2 transition-all ${
                  selectedPlan === plan.id
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Selection indicator */}
                <div
                  className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === plan.id
                      ? 'border-gray-900 bg-gray-900'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedPlan === plan.id && (
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  )}
                </div>

                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    {plan.name}
                  </h3>
                  {plan.highlighted && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded">
                      Popular
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mb-3">
                  {plan.priceLabel ? (
                    <span className="text-2xl font-bold text-gray-900">
                      {plan.priceLabel}
                    </span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gray-900">
                        ${plan.price}
                      </span>
                      <span className="text-sm text-gray-500">/mo</span>
                    </div>
                  )}
                </div>

                {/* Tagline */}
                <p className="text-xs text-gray-600 mb-3">{plan.tagline}</p>

                {/* Features */}
                <ul className="space-y-1.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check
                        className="w-3.5 h-3.5 mt-0.5 text-emerald-500 flex-shrink-0"
                        strokeWidth={2.5}
                      />
                      <span className="text-xs text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </section>

          {/* Sign Up Form */}
          <section className="max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                  placeholder="Min. 8 characters"
                />
              </div>
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-sm text-gray-500">
                  or continue with
                </span>
              </div>
            </div>

            {/* Social Sign Up */}
            <div className="space-y-3">
              <a
                href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api\/v1\/?$/, '')}/api/v1/auth/google`}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  Continue with Google
                </span>
              </a>
            </div>

            <p className="mt-4 text-center text-xs text-gray-500">
              By signing up, you agree to our{' '}
              <a href="/terms" className="underline hover:text-gray-700">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="underline hover:text-gray-700">
                Privacy Policy
              </a>
            </p>
          </section>
        </>
      ) : (
        /* Sign In Form */
        <section className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="signin-email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="signin-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label
                htmlFor="signin-password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="signin-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                placeholder="Enter your password"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <a
                href="/forgot-password"
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Forgot password?
              </a>
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-sm text-gray-500">
                or continue with
              </span>
            </div>
          </div>

          {/* Social Sign In */}
          <div className="space-y-3">
            <a
              href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api\/v1\/?$/, '')}/api/v1/auth/google`}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                Continue with Google
              </span>
            </a>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <button
              onClick={() => setAuthMode('signup')}
              className="font-medium text-gray-900 hover:underline"
            >
              Sign up for free
            </button>
          </p>
        </section>
      )}
    </div>
  );
}
