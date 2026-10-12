'use client';

import type { BillingPeriod, BillingToggleProps } from './types';

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  const handleToggle = (period: BillingPeriod) => {
    onChange(period);
  };

  return (
    <div className="inline-flex items-center p-1 bg-gray-100 rounded-full">
      <button
        type="button"
        onClick={() => handleToggle('monthly')}
        className={[
          'px-5 py-2 text-sm font-medium rounded-full transition-all duration-200',
          value === 'monthly'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900',
        ].join(' ')}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => handleToggle('annual')}
        className={[
          'px-5 py-2 text-sm font-medium rounded-full transition-all duration-200',
          value === 'annual'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900',
        ].join(' ')}
      >
        Annual
      </button>
    </div>
  );
}
