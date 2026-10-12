/**
 * RatingCell - Table cell component for displaying star ratings
 *
 * Used with Atlantis DataTable column definitions.
 */
import { cn } from '@/lib/utils';
import { Icon } from '../Icon';

export interface RatingCellProps {
  /**
   * Rating value (0-5)
   */
  readonly value: number;

  /**
   * Maximum rating value (default: 5)
   */
  readonly max?: number;

  /**
   * Show the numeric value alongside stars (default: true)
   */
  readonly showValue?: boolean;

  /**
   * Number of decimal places for the numeric value (default: 1)
   */
  readonly precision?: number;

  /**
   * Additional CSS classes
   */
  readonly className?: string;
}

export function RatingCell({
  value,
  max = 5,
  showValue = true,
  precision = 1,
  className,
}: RatingCellProps) {
  if (value === null || value === undefined) return null;

  // Clamp value to valid range
  const clampedValue = Math.max(0, Math.min(value, max));

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Icon name="star" size="small" color="warning" />
      {showValue && (
        <span className="tabular-nums">{clampedValue.toFixed(precision)}</span>
      )}
    </div>
  );
}

export default RatingCell;
