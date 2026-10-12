/**
 * CurrencyCell - Table cell component for displaying formatted currency values
 *
 * Used with Atlantis DataTable column definitions.
 * Uses AtlantisContext for locale and currency configuration.
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { Text } from '../Text';
import { useFormatCurrency } from '../FormatCurrency';

export interface CurrencyCellProps {
  /**
   * The numeric value to format as currency
   */
  readonly value: number | string | null | undefined;

  /**
   * Currency code (ISO 4217) - defaults to AtlantisContext currency
   */
  readonly currency?: string;

  /**
   * Text to show when value is null/undefined
   */
  readonly emptyText?: string;

  /**
   * Text variation for styling (e.g., 'error' for negative values)
   */
  readonly variation?: 'default' | 'success' | 'error' | 'subdued';

  /**
   * Additional CSS classes
   */
  readonly className?: string;
}

export function CurrencyCell({
  value,
  currency,
  emptyText = '—',
  variation = 'default',
  className,
}: CurrencyCellProps) {
  const formatCurrency = useFormatCurrency();
  const formattedValue = formatCurrency(value, { currency });

  if (!formattedValue) {
    return (
      <Text element="span" variation="subdued" className={className}>
        {emptyText}
      </Text>
    );
  }

  // Auto-detect negative values and use error variation
  const numValue = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  const autoVariation = numValue < 0 ? 'error' : variation;

  return (
    <Text
      element="span"
      variation={autoVariation === 'default' ? undefined : autoVariation}
      className={cn('tabular-nums font-medium', className)}
    >
      {formattedValue}
    </Text>
  );
}

export default CurrencyCell;
