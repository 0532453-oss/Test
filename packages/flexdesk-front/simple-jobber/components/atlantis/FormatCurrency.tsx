/**
 * FormatCurrency - Currency formatting component matching @jobber/components API
 *
 * Uses AtlantisContext for locale and currency symbol configuration.
 * Provides consistent currency formatting across the application.
 */
import React from 'react';
import { useAtlantisContext } from '../AtlantisContext';

export interface FormatCurrencyProps {
  /**
   * The numeric value to format as currency
   */
  readonly value: number | string | null | undefined;

  /**
   * Currency code (ISO 4217)
   * Defaults to detecting from AtlantisContext currencySymbol
   * @default 'USD'
   */
  readonly currency?: string;

  /**
   * Minimum number of fraction digits to display
   * @default 2
   */
  readonly minimumFractionDigits?: number;

  /**
   * Maximum number of fraction digits to display
   * @default 2
   */
  readonly maximumFractionDigits?: number;

  /**
   * Whether to show zero values
   * @default true
   */
  readonly showZero?: boolean;

  /**
   * Text to display when value is null/undefined/NaN
   * @default '—'
   */
  readonly emptyText?: string;
}

/**
 * Detect currency code from currency symbol
 */
function detectCurrencyFromSymbol(symbol: string): string {
  const symbolToCurrency: Record<string, string> = {
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY',
    'CA$': 'CAD',
    'A$': 'AUD',
    '₹': 'INR',
    'R$': 'BRL',
    'CHF': 'CHF',
    'kr': 'SEK',
    '₽': 'RUB',
  };
  return symbolToCurrency[symbol] || 'USD';
}

/**
 * Core currency formatting function that uses Atlantis context settings
 */
export function formatCurrencyValue(
  value: number | string | null | undefined,
  options: {
    currency?: string;
    locale?: string;
    currencySymbol?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string | null {
  const {
    currency,
    locale = 'en-US',
    currencySymbol = '$',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  if (value == null || value === '') return null;

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return null;

  const currencyCode = currency || detectCurrencyFromSymbol(currencySymbol);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numValue);
}

/**
 * Hook to get currency formatting function with context defaults
 */
export function useFormatCurrency() {
  const { locale, currencySymbol } = useAtlantisContext();

  return (
    value: number | string | null | undefined,
    options: {
      currency?: string;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    } = {}
  ) => {
    return formatCurrencyValue(value, {
      ...options,
      locale,
      currencySymbol,
    });
  };
}

/**
 * Component for rendering formatted currency values
 */
export function FormatCurrency({
  value,
  currency,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  showZero = true,
  emptyText = '—',
}: FormatCurrencyProps) {
  const { locale, currencySymbol } = useAtlantisContext();

  // Handle null/undefined
  if (value == null || value === '') {
    return <>{emptyText}</>;
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // Handle NaN
  if (isNaN(numValue)) {
    return <>{emptyText}</>;
  }

  // Handle zero if not showing
  if (!showZero && numValue === 0) {
    return <>{emptyText}</>;
  }

  const formattedValue = formatCurrencyValue(value, {
    currency,
    locale,
    currencySymbol,
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return <>{formattedValue || emptyText}</>;
}

export default FormatCurrency;
